import { type FormEvent, useEffect, useState } from 'react'
import {
  CircleAlert,
  Clock3,
  LoaderCircle,
  Package2,
  PencilLine,
  PlusCircle,
  RefreshCcw,
  ShieldCheck,
  Store,
  UtensilsCrossed,
} from 'lucide-react'

import { Reveal } from '@/components/ui/reveal'
import { SectionHeading } from '@/components/ui/section-heading'
import {
  DashboardDisclosureSection,
  DashboardMetricCard,
  InventoryItemCard,
  MenuDetailModal,
  MenuSummaryCard,
  MovementRecordCard,
} from '@/components/pymes/pyme-menu-ui'
import type {
  CreateItemForm,
  CreateMenuForm,
  FeedbackState,
  MenuEditorState,
  MenuItem,
  MenuMovement,
  OwnedPymeOption,
  StockItem,
  StockMenu,
  UserProfile,
} from '@/components/pymes/pyme-menu-shared'
import { emptyMenuEditor, formatDateTime } from '@/components/pymes/pyme-menu-shared'
import { authFetch, clearAuthTokens, getStoredUserId, hasStoredSession } from '@/lib/auth'
import { buildBackendUrl } from '@/lib/utils'

type PanelKey = 'inventory' | 'menus' | 'records'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const resolveString = (value: unknown) => {
  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }

  if (typeof value === 'number') {
    return String(value)
  }

  return null
}

const resolveNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)

    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return null
}

const toArray = <T,>(value: unknown, mapper: (entry: Record<string, unknown>) => T | null) => {
  if (!Array.isArray(value)) {
    return []
  }

  return value.reduce<T[]>((accumulator, entry) => {
    if (!isRecord(entry)) {
      return accumulator
    }

    const mappedEntry = mapper(entry)

    if (mappedEntry) {
      accumulator.push(mappedEntry)
    }

    return accumulator
  }, [])
}

const normalizeStockItem = (payload: unknown): StockItem | null => {
  if (!isRecord(payload)) {
    return null
  }

  const id = resolveString(payload.id)
  const name = resolveString(payload.name)

  if (!id || !name) {
    return null
  }

  return {
    id,
    name,
    profile_pic: resolveString(payload.profile_pic),
    price: resolveString(payload.price) ?? resolveNumber(payload.price),
    stock: resolveNumber(payload.stock),
  }
}

const normalizeMenuItem = (payload: unknown): MenuItem | null => {
  if (!isRecord(payload)) {
    return null
  }

  const id = resolveString(payload.id)

  if (!id) {
    return null
  }

  return {
    id,
    menu: resolveString(payload.menu) ?? undefined,
    item: normalizeStockItem(payload.item),
    quantity: resolveNumber(payload.quantity),
  }
}

const normalizeMenuMovement = (payload: unknown): MenuMovement | null => {
  if (!isRecord(payload)) {
    return null
  }

  const id = resolveString(payload.id)

  if (!id) {
    return null
  }

  return {
    id,
    menu: resolveString(payload.menu) ?? undefined,
    menu_name: resolveString(payload.menu_name) ?? undefined,
    item: normalizeStockItem(payload.item),
    item_name: resolveString(payload.item_name),
    performed_by: resolveString(payload.performed_by),
    action: resolveString(payload.action),
    action_display: resolveString(payload.action_display),
    quantity: resolveNumber(payload.quantity),
    previous_quantity: resolveNumber(payload.previous_quantity),
    details: resolveString(payload.details),
    created_at: resolveString(payload.created_at),
  }
}

const normalizeStockMenu = (payload: unknown): StockMenu | null => {
  if (!isRecord(payload)) {
    return null
  }

  const id = resolveString(payload.id)
  const name = resolveString(payload.name)

  if (!id || !name) {
    return null
  }

  return {
    id,
    pyme: resolveString(payload.pyme) ?? undefined,
    name,
    description: resolveString(payload.description) ?? 'Menu sin descripcion.',
    menu_items: toArray(payload.menu_items, normalizeMenuItem),
    movements: toArray(payload.movements, normalizeMenuMovement),
  }
}

const normalizeOwnedPyme = (payload: unknown): OwnedPymeOption | null => {
  if (!isRecord(payload)) {
    return null
  }

  const id = resolveString(payload.id)
  const name = resolveString(payload.name)

  if (!id || !name) {
    return null
  }

  return { id, name }
}

const normalizeCollection = <T,>(
  payload: unknown,
  mapper: (entry: Record<string, unknown>) => T | null,
) => {
  if (Array.isArray(payload)) {
    return toArray(payload, mapper)
  }

  if (!isRecord(payload)) {
    return []
  }

  const possibleLists = [payload.results, payload.data, payload.items, payload.menus, payload.stock]

  for (const candidate of possibleLists) {
    if (Array.isArray(candidate)) {
      return toArray(candidate, mapper)
    }
  }

  return []
}

const getResponseErrorMessage = async (response: Response, fallbackMessage: string) => {
  try {
    const data = await response.json()

    if (typeof data.detail === 'string') {
      return data.detail
    }

    if (typeof data.message === 'string') {
      return data.message
    }

    if (typeof data.error === 'string') {
      return data.error
    }

    if (isRecord(data)) {
      const firstEntry = Object.entries(data)[0]

      if (firstEntry) {
        const [, value] = firstEntry

        if (Array.isArray(value) && typeof value[0] === 'string') {
          return value[0]
        }

        if (typeof value === 'string') {
          return value
        }
      }
    }

    return fallbackMessage
  } catch {
    return fallbackMessage
  }
}

const PymeMenuManager = () => {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoadingAccess, setIsLoadingAccess] = useState(true)
  const [accessError, setAccessError] = useState<string | null>(null)
  const [items, setItems] = useState<StockItem[]>([])
  const [ownedPymes, setOwnedPymes] = useState<OwnedPymeOption[]>([])
  const [menus, setMenus] = useState<StockMenu[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [stockRefreshCount, setStockRefreshCount] = useState(0)
  const [dataError, setDataError] = useState<string | null>(null)
  const [createItemForm, setCreateItemForm] = useState<CreateItemForm>({
    name: '',
    price: '',
    stock: '',
  })
  const [itemImageFile, setItemImageFile] = useState<File | null>(null)
  const [itemImagePreview, setItemImagePreview] = useState<string | null>(null)
  const [createItemFeedback, setCreateItemFeedback] = useState<FeedbackState | null>(null)
  const [isCreatingItem, setIsCreatingItem] = useState(false)
  const [createMenuForm, setCreateMenuForm] = useState<CreateMenuForm>({
    pymeId: '',
    name: '',
    description: '',
  })
  const [createMenuFeedback, setCreateMenuFeedback] = useState<FeedbackState | null>(null)
  const [isCreatingMenu, setIsCreatingMenu] = useState(false)
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null)
  const [recordsMenuId, setRecordsMenuId] = useState<string>('all')
  const [menuEditors, setMenuEditors] = useState<Record<string, MenuEditorState>>({})
  const [menuFeedback, setMenuFeedback] = useState<Record<string, FeedbackState | null>>({})
  const [activeMenuMutationId, setActiveMenuMutationId] = useState<string | null>(null)
  const [openPanels, setOpenPanels] = useState<Record<PanelKey, boolean>>({
    inventory: false,
    menus: true,
    records: false,
  })
  const userId = getStoredUserId()
  const totalUnitsInStock = items.reduce((total, item) => total + (item.stock ?? 0), 0)
  const pymeNameById = new Map(ownedPymes.map((pyme) => [pyme.id, pyme.name]))
  const selectedMenu = menus.find((menu) => menu.id === selectedMenuId) ?? null
  const selectedMenuPymeName = selectedMenu?.pyme ? pymeNameById.get(selectedMenu.pyme) ?? null : null
  const currentMenuEditor = selectedMenu ? menuEditors[selectedMenu.id] ?? emptyMenuEditor : emptyMenuEditor
  const currentMenuFeedback = selectedMenu ? menuFeedback[selectedMenu.id] ?? null : null
  const allMovements = menus
    .flatMap((menu) =>
      menu.movements.map((movement) => ({
        ...movement,
        menu: movement.menu ?? menu.id,
        menu_name: movement.menu_name ?? menu.name,
      })),
    )
    .sort((currentMovement, nextMovement) => {
      const currentParsedDate = currentMovement.created_at
        ? Date.parse(currentMovement.created_at)
        : 0
      const nextParsedDate = nextMovement.created_at ? Date.parse(nextMovement.created_at) : 0
      const currentTimestamp = Number.isFinite(currentParsedDate) ? currentParsedDate : 0
      const nextTimestamp = Number.isFinite(nextParsedDate) ? nextParsedDate : 0

      return nextTimestamp - currentTimestamp
    })
  const filteredMovements =
    recordsMenuId === 'all'
      ? allMovements
      : allMovements.filter((movement) => movement.menu === recordsMenuId)
  const lastMovementLabel =
    allMovements.length > 0 ? formatDateTime(allMovements[0]?.created_at) : 'Sin movimientos'
  const menusWithMovements = menus.filter((menu) => menu.movements.length > 0).length

  const togglePanel = (panel: PanelKey) => {
    setOpenPanels((currentPanels) => ({
      ...currentPanels,
      [panel]: !currentPanels[panel],
    }))
  }

  const openPanel = (panel: PanelKey) => {
    setOpenPanels((currentPanels) => ({
      ...currentPanels,
      [panel]: true,
    }))
  }

  useEffect(() => {
    if (!itemImageFile) {
      setItemImagePreview(null)
      return
    }

    const objectUrl = URL.createObjectURL(itemImageFile)
    setItemImagePreview(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [itemImageFile])

  useEffect(() => {
    if (!hasStoredSession()) {
      setAccessError('Inicia sesion para gestionar menus e inventario.')
      setIsLoadingAccess(false)
      return
    }

    if (!userId) {
      setAccessError('No pudimos identificar tu cuenta para validar permisos.')
      setIsLoadingAccess(false)
      return
    }

    const loadUser = async () => {
      try {
        const response = await authFetch(buildBackendUrl(`/api/user/${userId}/`))

        if (!response.ok) {
          if (response.status === 401) {
            clearAuthTokens()
            setAccessError('Tu sesion vencio. Inicia sesion de nuevo para continuar.')
            return
          }

          throw new Error(await getResponseErrorMessage(response, 'No se pudo validar tu cuenta.'))
        }

        const data = await response.json()
        setUser(isRecord(data) ? (data as UserProfile) : null)
        setAccessError(null)
      } catch (error) {
        setAccessError(
          error instanceof Error ? error.message : 'No se pudo validar tu cuenta.',
        )
      } finally {
        setIsLoadingAccess(false)
      }
    }

    void loadUser()
  }, [userId])

  useEffect(() => {
    if (!user?.is_pyme_owner) {
      setItems([])
      setMenus([])
      setSelectedMenuId(null)
      setIsLoadingData(false)
      setIsRefreshing(false)
      return
    }

    const isManualRefresh = stockRefreshCount > 0

    if (isManualRefresh) {
      setIsRefreshing(true)
    } else {
      setIsLoadingData(true)
    }

    const loadStockData = async () => {
      try {
        const [itemsResponse, menusResponse, ownedPymesResponse] = await Promise.all([
          authFetch(buildBackendUrl('/api/stock/items/')),
          authFetch(buildBackendUrl('/api/stock/menus/')),
          authFetch(buildBackendUrl('/api/pyme/my/')),
        ])

        if (!itemsResponse.ok || !menusResponse.ok || !ownedPymesResponse.ok) {
          const failingResponse = !itemsResponse.ok
            ? itemsResponse
            : !menusResponse.ok
              ? menusResponse
              : ownedPymesResponse

          if (failingResponse.status === 401) {
            clearAuthTokens()
            setDataError(
              'Tu sesion vencio. Inicia sesion de nuevo para seguir gestionando stock.',
            )
            return
          }

          throw new Error(
            await getResponseErrorMessage(
              failingResponse,
              'No se pudo cargar la gestion de menus e inventario.',
            ),
          )
        }

        const [itemsPayload, menusPayload, ownedPymesPayload] = await Promise.all([
          itemsResponse.json(),
          menusResponse.json(),
          ownedPymesResponse.json(),
        ])

        setItems(normalizeCollection(itemsPayload, normalizeStockItem))
        setMenus(normalizeCollection(menusPayload, normalizeStockMenu))
        const normalizedOwnedPymes = normalizeCollection(ownedPymesPayload, normalizeOwnedPyme)
        setOwnedPymes(normalizedOwnedPymes)
        setCreateMenuForm((currentForm) => ({
          ...currentForm,
          pymeId:
            currentForm.pymeId && normalizedOwnedPymes.some((pyme) => pyme.id === currentForm.pymeId)
              ? currentForm.pymeId
              : normalizedOwnedPymes[0]?.id ?? '',
        }))
        setDataError(null)
      } catch (error) {
        setDataError(
          error instanceof Error
            ? error.message
            : 'No se pudo cargar la gestion de menus e inventario.',
        )
      } finally {
        setIsLoadingData(false)
        setIsRefreshing(false)
      }
    }

    void loadStockData()
  }, [stockRefreshCount, user?.is_pyme_owner])

  useEffect(() => {
    if (!selectedMenuId) {
      return
    }

    const originalOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedMenuId(null)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedMenuId])

  const handleRefresh = () => {
    setStockRefreshCount((currentValue) => currentValue + 1)
  }

  const handleCreateItemFieldChange = (field: keyof CreateItemForm, value: string) => {
    setCreateItemForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
  }

  const handleCreateMenuFieldChange = (field: keyof CreateMenuForm, value: string) => {
    setCreateMenuForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
  }

  const handleMenuEditorChange = (
    menuId: string,
    field: keyof MenuEditorState,
    value: string,
  ) => {
    setMenuEditors((currentEditors) => ({
      ...currentEditors,
      [menuId]: {
        ...(currentEditors[menuId] ?? emptyMenuEditor),
        [field]: value,
      },
    }))
    setMenuFeedback((currentFeedback) => ({
      ...currentFeedback,
      [menuId]: null,
    }))
  }

  const handleCreateItemSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!user?.is_pyme_owner) {
      setCreateItemFeedback({
        type: 'error',
        message: 'Solo las cuentas con rol de dueno de pyme pueden crear inventario.',
      })
      return
    }

    const name = createItemForm.name.trim()
    const price = createItemForm.price.trim()
    const stock = createItemForm.stock.trim()
    const normalizedStock = Number(stock)
    const normalizedPrice = Number(price)

    if (!name || !price || !stock) {
      setCreateItemFeedback({
        type: 'error',
        message: 'Completa nombre, precio y stock antes de guardar el item.',
      })
      return
    }

    if (!itemImageFile) {
      setCreateItemFeedback({
        type: 'error',
        message: 'Agrega una imagen para el item del inventario.',
      })
      return
    }

    if (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
      setCreateItemFeedback({
        type: 'error',
        message: 'El precio debe ser un numero mayor que cero.',
      })
      return
    }

    if (!Number.isInteger(normalizedStock) || normalizedStock < 0) {
      setCreateItemFeedback({
        type: 'error',
        message: 'El stock debe ser un numero entero igual o mayor que cero.',
      })
      return
    }

    const payload = new FormData()
    payload.append('name', name)
    payload.append('price', price)
    payload.append('stock', stock)
    payload.append('profile_pic', itemImageFile)

    setIsCreatingItem(true)
    setCreateItemFeedback(null)
    openPanel('inventory')

    try {
      const response = await authFetch(buildBackendUrl('/api/stock/items/'), {
        method: 'POST',
        body: payload,
      })

      if (!response.ok) {
        if (response.status === 401) {
          clearAuthTokens()
          setCreateItemFeedback({
            type: 'error',
            message: 'Tu sesion vencio. Inicia sesion de nuevo para crear inventario.',
          })
          return
        }

        throw new Error(await getResponseErrorMessage(response, 'No se pudo crear el item.'))
      }

      const data = await response.json()
      const createdItem = normalizeStockItem(data)

      if (createdItem) {
        setItems((currentItems) => [createdItem, ...currentItems])
      }

      setCreateItemForm({
        name: '',
        price: '',
        stock: '',
      })
      setItemImageFile(null)
      setCreateItemFeedback({
        type: 'success',
        message: 'El item ya aparece en tu inventario y queda listo para usar en menus.',
      })
    } catch (error) {
      setCreateItemFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'No se pudo crear el item.',
      })
    } finally {
      setIsCreatingItem(false)
    }
  }

  const handleCreateMenuSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!user?.is_pyme_owner) {
      setCreateMenuFeedback({
        type: 'error',
        message: 'Solo las cuentas con rol de dueno de pyme pueden crear menus.',
      })
      return
    }

    if (ownedPymes.length === 0) {
      setCreateMenuFeedback({
        type: 'error',
        message: 'Primero necesitas tener al menos una pyme creada para registrar menus.',
      })
      return
    }

    const name = createMenuForm.name.trim()
    const description = createMenuForm.description.trim()
    const pymeId = createMenuForm.pymeId.trim()

    if (!pymeId) {
      setCreateMenuFeedback({
        type: 'error',
        message: 'Selecciona la pyme a la que pertenecera este menu.',
      })
      return
    }

    if (!name || !description) {
      setCreateMenuFeedback({
        type: 'error',
        message: 'Completa nombre y descripcion para crear el menu.',
      })
      return
    }

    setIsCreatingMenu(true)
    setCreateMenuFeedback(null)
    openPanel('menus')

    try {
      const response = await authFetch(buildBackendUrl('/api/stock/menus/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pyme_id: pymeId,
          name,
          description,
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          clearAuthTokens()
          setCreateMenuFeedback({
            type: 'error',
            message: 'Tu sesion vencio. Inicia sesion de nuevo para crear menus.',
          })
          return
        }

        throw new Error(await getResponseErrorMessage(response, 'No se pudo crear el menu.'))
      }

      const data = await response.json()
      const createdMenu = normalizeStockMenu(data)

      if (createdMenu) {
        setMenus((currentMenus) => [createdMenu, ...currentMenus])
        setSelectedMenuId(createdMenu.id)
      }

      setCreateMenuForm({
        pymeId: createMenuForm.pymeId,
        name: '',
        description: '',
      })
      setCreateMenuFeedback({
        type: 'success',
        message: 'El menu se creo correctamente. Ya puedes agregarle items y revisar stock.',
      })
    } catch (error) {
      setCreateMenuFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'No se pudo crear el menu.',
      })
    } finally {
      setIsCreatingMenu(false)
    }
  }

  const handleAttachItemSubmit = async (event: FormEvent<HTMLFormElement>, menuId: string) => {
    event.preventDefault()

    if (!user?.is_pyme_owner) {
      setMenuFeedback((currentFeedback) => ({
        ...currentFeedback,
        [menuId]: {
          type: 'error',
          message: 'Solo las cuentas con rol de dueno de pyme pueden editar menus.',
        },
      }))
      return
    }

    const editorState = menuEditors[menuId] ?? emptyMenuEditor
    const selectedItem = items.find((item) => item.id === editorState.itemId) ?? null
    const quantity = Number(editorState.quantity)

    if (!selectedItem) {
      setMenuFeedback((currentFeedback) => ({
        ...currentFeedback,
        [menuId]: {
          type: 'error',
          message: 'Selecciona un item del inventario para agregarlo al menu.',
        },
      }))
      return
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setMenuFeedback((currentFeedback) => ({
        ...currentFeedback,
        [menuId]: {
          type: 'error',
          message: 'La cantidad debe ser un numero entero mayor que cero.',
        },
      }))
      return
    }

    if ((selectedItem.stock ?? 0) < quantity) {
      setMenuFeedback((currentFeedback) => ({
        ...currentFeedback,
        [menuId]: {
          type: 'error',
          message: `No hay stock suficiente de ${selectedItem.name} para esa cantidad.`,
        },
      }))
      return
    }

    setActiveMenuMutationId(menuId)
    setMenuFeedback((currentFeedback) => ({
      ...currentFeedback,
      [menuId]: null,
    }))

    try {
      const response = await authFetch(buildBackendUrl(`/api/stock/menus/${menuId}/items/`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_id: selectedItem.id,
          quantity,
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          clearAuthTokens()
          setMenuFeedback((currentFeedback) => ({
            ...currentFeedback,
            [menuId]: {
              type: 'error',
              message: 'Tu sesion vencio. Inicia sesion de nuevo para editar el menu.',
            },
          }))
          return
        }

        throw new Error(
          await getResponseErrorMessage(
            response,
            'No se pudo actualizar el menu con ese item.',
          ),
        )
      }

      const data = await response.json()
      const updatedMenu = normalizeStockMenu(data)

      if (updatedMenu) {
        setMenus((currentMenus) =>
          currentMenus.map((menu) => (menu.id === updatedMenu.id ? updatedMenu : menu)),
        )

        const stockByItemId = new Map<string, StockItem>()
        updatedMenu.menu_items.forEach((menuItem) => {
          if (menuItem.item?.id) {
            stockByItemId.set(menuItem.item.id, menuItem.item)
          }
        })

        setItems((currentItems) =>
          currentItems.map((item) => stockByItemId.get(item.id) ?? item),
        )
      }

      setMenuEditors((currentEditors) => ({
        ...currentEditors,
        [menuId]: emptyMenuEditor,
      }))
      setMenuFeedback((currentFeedback) => ({
        ...currentFeedback,
        [menuId]: {
          type: 'success',
          message: 'El menu se actualizo y el stock ya refleja la salida registrada.',
        },
      }))
    } catch (error) {
      setMenuFeedback((currentFeedback) => ({
        ...currentFeedback,
        [menuId]: {
          type: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'No se pudo actualizar el menu con ese item.',
        },
      }))
    } finally {
      setActiveMenuMutationId(null)
    }
  }

  const handleOpenMenuModal = (menuId: string) => {
    setSelectedMenuId(menuId)
  }

  const handleCloseMenuModal = () => {
    setSelectedMenuId(null)
  }

  const handleOpenRecordsForMenu = (menuId: string) => {
    setRecordsMenuId(menuId)
    openPanel('records')
    setSelectedMenuId(null)
    window.setTimeout(() => {
      document.getElementById('dashboard-registros')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 50)
  }

  if (isLoadingAccess) {
    return (
      <section className="mx-auto w-full max-w-5xl px-6 pb-16 md:px-8 md:pb-20">
        <div className="grid gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-48 animate-pulse rounded-3xl border border-border/70 bg-card/70"
            />
          ))}
        </div>
      </section>
    )
  }

  if (accessError) {
    return (
      <section className="mx-auto w-full max-w-5xl px-6 pb-16 md:px-8 md:pb-20">
        <Reveal>
          <div className="rounded-3xl border border-destructive/20 bg-card p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-destructive/10 p-3 text-destructive">
                <CircleAlert className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight">
                  No pudimos validar tus permisos
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{accessError}</p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    )
  }

  if (!user?.is_pyme_owner) {
    return (
      <section className="mx-auto w-full max-w-5xl px-6 pb-16 md:px-8 md:pb-20">
        <Reveal>
          <div className="rounded-[2rem] border border-border/80 bg-card p-8 shadow-sm">
            <div className="flex max-w-3xl flex-col gap-4 md:flex-row md:items-start">
              <div className="inline-flex w-fit rounded-2xl bg-primary/10 p-3 text-primary">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">
                  Acceso protegido
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                  Menus e inventario solo para duenos de pyme
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                  Tu cuenta actual no tiene `is_pyme_owner`, por eso esta parte queda en solo
                  lectura desde la navegacion general. Si este usuario si deberia operar menus,
                  puedes activar ese rol desde tu perfil y volver aqui.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-6 pb-16 md:px-8 md:pb-20">
      <Reveal>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            badge="Menus e inventario"
            title="Opera menus con componentes desplegables"
            description="El dashboard ahora separa tarjetas, modal y registros en componentes, y las secciones largas se pueden plegar para que la vista sea mucho mas compacta."
          />
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoadingData}
            className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRefreshing ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <RefreshCcw className="size-4" />
            )}
            {isRefreshing ? 'Actualizando...' : 'Actualizar datos'}
          </button>
        </div>
      </Reveal>

      <Reveal delay={0.04}>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DashboardMetricCard icon={Package2} label="Items cargados" value={items.length} />
          <DashboardMetricCard
            icon={Store}
            label="Unidades en stock"
            value={totalUnitsInStock}
          />
          <DashboardMetricCard
            icon={UtensilsCrossed}
            label="Menus disponibles"
            value={menus.length}
          />
          <DashboardMetricCard
            icon={Clock3}
            label="Ultimo registro"
            value={<span className="text-lg">{lastMovementLabel}</span>}
          />
        </div>
      </Reveal>

      <Reveal delay={0.08}>
        <div className="mt-6 rounded-[1.75rem] border border-border/80 bg-background/90 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <PencilLine className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-tight">
                Alcance real de la edicion disponible
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                La API actual ya deja crear menus, verlos y editar su contenido agregando items.
                Todavia no expone un `PATCH` para renombrar menus o cambiar su descripcion, por
                eso el pop-up de edicion se centra en composicion, movimientos y stock.
              </p>
            </div>
          </div>
        </div>
      </Reveal>

      {dataError ? (
        <Reveal>
          <div className="mt-6 rounded-3xl border border-destructive/20 bg-card p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-destructive/10 p-3 text-destructive">
                <CircleAlert className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight">
                  No pudimos cargar menus e inventario
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{dataError}</p>
              </div>
            </div>
          </div>
        </Reveal>
      ) : null}

      <div className="mt-8 space-y-6">
        <Reveal delay={0.12}>
          <DashboardDisclosureSection
            badge="Inventario"
            title="Crea items y deja visible su stock"
            description="Cada item que registres aqui queda disponible para anexarlo a un menu y el stock restante se refleja despues de cada movimiento."
            isOpen={openPanels.inventory}
            onToggle={() => togglePanel('inventory')}
            collapsedSummary="Despliega esta seccion para crear items y revisar el inventario actual sin hacer mas larga la pagina."
          >
            {createItemFeedback ? (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  createItemFeedback.type === 'success'
                    ? 'border-primary/20 bg-primary/10 text-foreground'
                    : 'border-destructive/20 bg-destructive/10 text-foreground'
                }`}
              >
                {createItemFeedback.message}
              </div>
            ) : null}

            <form className="mt-5 grid gap-3" onSubmit={handleCreateItemSubmit}>
              <label className="block">
                <span className="text-sm font-medium text-foreground">Nombre del item</span>
                <input
                  type="text"
                  value={createItemForm.name}
                  onChange={(event) => handleCreateItemFieldChange('name', event.target.value)}
                  placeholder="Cold Brew Bottle"
                  className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-foreground">Precio</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={createItemForm.price}
                    onChange={(event) => handleCreateItemFieldChange('price', event.target.value)}
                    placeholder="4.50"
                    className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-foreground">Stock inicial</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={createItemForm.stock}
                    onChange={(event) => handleCreateItemFieldChange('stock', event.target.value)}
                    placeholder="120"
                    className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-foreground">Imagen del item</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setItemImageFile(event.target.files?.[0] ?? null)}
                  className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                {itemImageFile ? (
                  <div className="mt-3 flex items-center gap-3 rounded-2xl bg-background px-3 py-3 ring-1 ring-border">
                    {itemImagePreview ? (
                      <img
                        src={itemImagePreview}
                        alt="Vista previa del item"
                        className="h-12 w-12 rounded-xl object-cover ring-1 ring-border"
                      />
                    ) : null}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {itemImageFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(itemImageFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : null}
              </label>

              <button
                type="submit"
                disabled={isCreatingItem}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isCreatingItem ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <PlusCircle className="size-4" />
                )}
                {isCreatingItem ? 'Guardando item...' : 'Guardar item'}
              </button>
            </form>

            <div className="mt-6 space-y-3">
              {isLoadingData ? (
                [0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="h-24 animate-pulse rounded-3xl border border-border/70 bg-background/70"
                  />
                ))
              ) : items.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border bg-background/70 px-5 py-6">
                  <p className="text-sm font-medium text-foreground">Aun no hay items cargados</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Empieza creando inventario aqui mismo para luego poder anexarlo a tus menus.
                  </p>
                </div>
              ) : (
                items.map((item) => <InventoryItemCard key={item.id} item={item} />)
              )}
            </div>
          </DashboardDisclosureSection>
        </Reveal>

        <Reveal delay={0.16}>
          <DashboardDisclosureSection
            badge="Menus"
            title="Crea menus y abre su detalle aparte"
            description="Cada tarjeta queda compacta y desplegable. Cuando necesites revisar o editar un menu, lo abres en un pop-up con su contenido completo."
            isOpen={openPanels.menus}
            onToggle={() => togglePanel('menus')}
            collapsedSummary="Despliega esta seccion para crear menus, elegir la pyme a la que pertenecen y revisar sus tarjetas compactas sin alargar la vista principal."
          >
            {createMenuFeedback ? (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  createMenuFeedback.type === 'success'
                    ? 'border-primary/20 bg-primary/10 text-foreground'
                    : 'border-destructive/20 bg-destructive/10 text-foreground'
                }`}
              >
                {createMenuFeedback.message}
              </div>
            ) : null}

            <form className="mt-5 grid gap-3" onSubmit={handleCreateMenuSubmit}>
              <label className="block">
                <span className="text-sm font-medium text-foreground">Pyme a la que pertenece</span>
                <select
                  value={createMenuForm.pymeId}
                  onChange={(event) => handleCreateMenuFieldChange('pymeId', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Selecciona una pyme</option>
                  {ownedPymes.map((pyme) => (
                    <option key={pyme.id} value={pyme.id}>
                      {pyme.name}
                    </option>
                  ))}
                </select>
              </label>
              {ownedPymes.length === 0 ? (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-foreground">
                  Aun no tienes pymes propias cargadas. Crea una pyme primero para poder asignarle
                  menus.
                </div>
              ) : null}

              <label className="block">
                <span className="text-sm font-medium text-foreground">Nombre del menu</span>
                <input
                  type="text"
                  value={createMenuForm.name}
                  onChange={(event) => handleCreateMenuFieldChange('name', event.target.value)}
                  placeholder="Breakfast Menu"
                  className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-foreground">Descripcion</span>
                <textarea
                  value={createMenuForm.description}
                  onChange={(event) =>
                    handleCreateMenuFieldChange('description', event.target.value)
                  }
                  rows={4}
                  placeholder="Morning drinks and sandwiches."
                  className="mt-2 w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>

              <button
                type="submit"
                disabled={isCreatingMenu || ownedPymes.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isCreatingMenu ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <PlusCircle className="size-4" />
                )}
                {isCreatingMenu ? 'Guardando menu...' : 'Guardar menu'}
              </button>
            </form>

            <div className="mt-6 space-y-4">
              {isLoadingData ? (
                [0, 1].map((item) => (
                  <div
                    key={item}
                    className="h-48 animate-pulse rounded-3xl border border-border/70 bg-background/70"
                  />
                ))
              ) : menus.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border bg-background/70 px-5 py-6">
                  <p className="text-sm font-medium text-foreground">Aun no hay menus creados</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Crea uno desde este formulario y despues agregale items desde el editor de
                    contenido.
                  </p>
                </div>
              ) : (
                menus.map((menu) => (
                  <MenuSummaryCard
                    key={menu.id}
                    menu={menu}
                    pymeName={menu.pyme ? pymeNameById.get(menu.pyme) ?? null : null}
                    onOpenMenu={handleOpenMenuModal}
                    onOpenRecords={handleOpenRecordsForMenu}
                  />
                ))
              )}
            </div>
          </DashboardDisclosureSection>
        </Reveal>

        <section id="dashboard-registros">
          <Reveal delay={0.2}>
            <DashboardDisclosureSection
              badge="Registros"
              title="Historial operativo separado del editor"
              description="Este bloque vive aparte para que puedas revisar movimientos, cantidades y responsables sin abrir menu por menu."
              isOpen={openPanels.records}
              onToggle={() => togglePanel('records')}
              collapsedSummary="Despliega esta seccion para revisar el historial operativo solo cuando lo necesites."
            >
              <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
                <div className="space-y-4">
                  <DashboardMetricCard
                    icon={Clock3}
                    label="Registros totales"
                    value={allMovements.length}
                  />
                  <DashboardMetricCard
                    icon={UtensilsCrossed}
                    label="Menus con actividad"
                    value={menusWithMovements}
                  />
                  <div className="rounded-3xl border border-border/80 bg-background/70 p-5">
                    <label className="block">
                      <span className="text-sm font-medium text-foreground">Filtrar por menu</span>
                      <select
                        value={recordsMenuId}
                        onChange={(event) => setRecordsMenuId(event.target.value)}
                        className="mt-3 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="all">Todos los menus</option>
                        {menus.map((menu) => (
                          <option key={menu.id} value={menu.id}>
                            {menu.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                <div>
                  {filteredMovements.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-border bg-background/70 px-5 py-8">
                      <p className="text-sm font-medium text-foreground">
                        No hay registros para este filtro
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Cuando agregues items a un menu, aqui quedaran visibles los movimientos con
                        fecha, responsable y cantidad.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredMovements.map((movement) => (
                        <MovementRecordCard key={movement.id} movement={movement} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </DashboardDisclosureSection>
          </Reveal>
        </section>
      </div>

      {selectedMenu ? (
        <MenuDetailModal
          menu={selectedMenu}
          pymeName={selectedMenuPymeName}
          items={items}
          editorState={currentMenuEditor}
          feedback={currentMenuFeedback}
          isSaving={activeMenuMutationId === selectedMenu.id}
          onClose={handleCloseMenuModal}
          onOpenRecords={() => handleOpenRecordsForMenu(selectedMenu.id)}
          onEditorChange={(field, value) => handleMenuEditorChange(selectedMenu.id, field, value)}
          onSubmit={(event) => handleAttachItemSubmit(event, selectedMenu.id)}
        />
      ) : null}
    </section>
  )
}

export default PymeMenuManager
