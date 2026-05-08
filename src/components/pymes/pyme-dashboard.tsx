import { type FormEvent, useEffect, useState } from 'react'
import { Building2, ChevronDown, CircleAlert, LoaderCircle, PlusCircle } from 'lucide-react'

import { Reveal } from '@/components/ui/reveal'
import { SectionHeading } from '@/components/ui/section-heading'
import { authFetch, clearAuthTokens, hasStoredSession } from '@/lib/auth'
import { buildBackendUrl } from '@/lib/utils'

type PymeCategory = {
  id?: string | number
  name?: string
  title?: string
}

type PymeRecord = {
  id: string
  name: string
  description: string
  owner?: string | number | null
  category?: PymeCategory | string | null
  profile_pic?: string
  access_date?: string
  foundation_date?: string
} & Record<string, unknown>

type PymeCollection = {
  items: PymeRecord[]
  total: number
}

type CreatePymeForm = {
  name: string
  description: string
  categoryId: string
  foundationDate: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const toPymeArray = (value: unknown): PymeRecord[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(isRecord) as PymeRecord[]
}

const toCategoryArray = (value: unknown): PymeCategory[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(isRecord) as PymeCategory[]
}

const normalizePymesResponse = (payload: unknown): PymeCollection => {
  if (Array.isArray(payload)) {
    return {
      items: toPymeArray(payload),
      total: payload.length,
    }
  }

  if (!isRecord(payload)) {
    return {
      items: [],
      total: 0,
    }
  }

  const possibleLists = [payload.results, payload.data, payload.pymes, payload.items]

  for (const candidate of possibleLists) {
    if (Array.isArray(candidate)) {
      const normalizedItems = toPymeArray(candidate)
      const total =
        typeof payload.count === 'number' && Number.isFinite(payload.count)
          ? payload.count
          : normalizedItems.length

      return {
        items: normalizedItems,
        total,
      }
    }
  }

  return {
    items: [],
    total: 0,
  }
}

const normalizeCategoriesResponse = (payload: unknown): PymeCategory[] => {
  if (Array.isArray(payload)) {
    return toCategoryArray(payload)
  }

  if (!isRecord(payload)) {
    return []
  }

  const possibleLists = [payload.results, payload.data, payload.categories, payload.items]

  for (const candidate of possibleLists) {
    if (Array.isArray(candidate)) {
      return toCategoryArray(candidate)
    }
  }

  return []
}

const getTextValue = (record: PymeRecord, keys: string[]) => {
  for (const key of keys) {
    const value = record[key]

    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }

    if (typeof value === 'number') {
      return String(value)
    }
  }

  return null
}

const getCategoryId = (category: PymeCategory) => {
  if (typeof category.id === 'string' || typeof category.id === 'number') {
    return String(category.id)
  }

  return null
}

const getCategoryLabel = (category: PymeCategory, index: number) =>
  (typeof category.name === 'string' && category.name.trim()) ||
  (typeof category.title === 'string' && category.title.trim()) ||
  `Categoria ${index + 1}`

const formatDate = (value?: string) => {
  if (!value) {
    return null
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat('es-CR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsedDate)
}

const getPymeName = (pyme: PymeRecord, index: number) =>
  getTextValue(pyme, ['name', 'nombre', 'business_name', 'company_name', 'title']) ||
  `Pyme ${index + 1}`

const getPymeDescription = (pyme: PymeRecord) =>
  getTextValue(pyme, ['description', 'descripcion', 'summary', 'about']) ||
  'Tu pyme ya esta registrada y lista para seguir creciendo dentro de Mentras.'

const getPymeTags = (pyme: PymeRecord) =>
  [
    getTextValue(pyme, ['status', 'estado']),
    typeof pyme.category === 'string'
      ? pyme.category
      : pyme.category && typeof pyme.category === 'object'
        ? getTextValue(pyme.category as PymeRecord, ['name', 'title', 'category'])
        : getTextValue(pyme, ['categoria', 'sector', 'industry']),
    getTextValue(pyme, ['city', 'ciudad', 'location', 'ubicacion']),
    pyme.foundation_date ? `Fundada ${formatDate(pyme.foundation_date)}` : null,
    pyme.access_date ? `Entro a Mentras:${formatDate(pyme.access_date)}` : null,
  ].filter((value): value is string => Boolean(value))

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

    if (data && typeof data === 'object') {
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

const PymeDashboard = () => {
  const [pymes, setPymes] = useState<PymeRecord[]>([])
  const [categories, setCategories] = useState<PymeCategory[]>([])
  const [totalPymes, setTotalPymes] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [hasRequestedCategories, setHasRequestedCategories] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [categoriesErrorMessage, setCategoriesErrorMessage] = useState<string | null>(null)
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false)
  const [isCreatingPyme, setIsCreatingPyme] = useState(false)
  const [createPymeFeedback, setCreatePymeFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [createPymeForm, setCreatePymeForm] = useState<CreatePymeForm>({
    name: '',
    description: '',
    categoryId: '',
    foundationDate: '',
  })
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null)
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null)

  useEffect(() => {
    const loadPymes = async () => {
      if (!hasStoredSession()) {
        setErrorMessage('Inicia sesion para ver tus pymes y seguir organizando tu espacio.')
        setIsLoading(false)
        return
      }

      try {
        const response = await authFetch(buildBackendUrl('/api/pyme/my/'))

        if (!response.ok) {
          if (response.status === 401) {
            clearAuthTokens()
            setErrorMessage('Tu sesion vencio. Inicia sesion de nuevo para consultar tus pymes.')
            return
          }

          throw new Error(`No se pudieron cargar tus pymes. Codigo ${response.status}.`)
        }

        const data = await response.json()
        const normalizedResponse = normalizePymesResponse(data)

        setPymes(normalizedResponse.items.slice(0, 3))
        setTotalPymes(normalizedResponse.total)
        setErrorMessage(null)
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Ocurrio un error al cargar tus pymes.',
        )
      } finally {
        setIsLoading(false)
      }
    }

    loadPymes()
  }, [])

  useEffect(() => {
    if (!isCreateMenuOpen || hasRequestedCategories || isLoadingCategories) {
      return
    }

    const loadCategories = async () => {
      if (!hasStoredSession()) {
        setCategoriesErrorMessage('Inicia sesion para consultar las categorias disponibles.')
        return
      }

      setHasRequestedCategories(true)
      setIsLoadingCategories(true)
      setCategoriesErrorMessage(null)

      try {
        const response = await authFetch(buildBackendUrl('/api/pyme/categories/'))

        if (!response.ok) {
          if (response.status === 401) {
            clearAuthTokens()
            setCategoriesErrorMessage(
              'Tu sesion vencio. Inicia sesion de nuevo para consultar las categorias.',
            )
            return
          }

          throw new Error(
            await getResponseErrorMessage(response, 'No se pudieron cargar las categorias.'),
          )
        }

        const data = await response.json()
        setCategories(normalizeCategoriesResponse(data))
      } catch (error) {
        setCategoriesErrorMessage(
          error instanceof Error ? error.message : 'Ocurrio un error al cargar las categorias.',
        )
      } finally {
        setIsLoadingCategories(false)
      }
    }

    void loadCategories()
  }, [hasRequestedCategories, isCreateMenuOpen, isLoadingCategories])

  const handleCreatePymeFieldChange = (field: keyof CreatePymeForm, value: string) => {
    setCreatePymeForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
  }

  const handleProfilePicFileChange = (file: File | null) => {
    setProfilePicFile(file)
    setCreatePymeFeedback(null)

    if (!file) {
      setProfilePicPreview(null)
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setProfilePicPreview(objectUrl)
  }

  useEffect(() => {
    return () => {
      if (profilePicPreview) {
        URL.revokeObjectURL(profilePicPreview)
      }
    }
  }, [profilePicPreview])

  const toggleCreateMenu = () => {
    setIsCreateMenuOpen((currentState) => !currentState)
    setCreatePymeFeedback(null)
  }

  const handleRetryCategoriesLoad = () => {
    if (isLoadingCategories) {
      return
    }

    setHasRequestedCategories(false)
    setCategoriesErrorMessage(null)
  }

  const handleCreatePymeSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!hasStoredSession()) {
      setCreatePymeFeedback({
        type: 'error',
        message: 'Inicia sesion para crear una pyme nueva.',
      })
      return
    }

    const name = createPymeForm.name.trim()
    const description = createPymeForm.description.trim()
    const foundationDate = createPymeForm.foundationDate
    const selectedCategoryId = createPymeForm.categoryId.trim()

    if (!name || !description) {
      setCreatePymeFeedback({
        type: 'error',
        message: 'Completa al menos el nombre y la descripcion de la pyme.',
      })
      return
    }

    if (!foundationDate) {
      setCreatePymeFeedback({
        type: 'error',
        message: 'Completa la fecha de fundacion de la pyme.',
      })
      return
    }

    setIsCreatingPyme(true)
    setCreatePymeFeedback(null)

    try {
      const selectedCategory =
        categories.find((category) => getCategoryId(category) === selectedCategoryId) ?? null
      const payload = new FormData()
      payload.append('name', name)
      payload.append('description', description)
      payload.append('foundation_date', foundationDate)

      if (selectedCategoryId) {
        payload.append('category_id', selectedCategoryId)
      }

      if (profilePicFile) {
        payload.append('profile_pic', profilePicFile)
      }

      const response = await authFetch(buildBackendUrl('/api/pyme/'), {
        method: 'POST',
        body: payload,
      })

      if (!response.ok) {
        if (response.status === 401) {
          clearAuthTokens()
          setCreatePymeFeedback({
            type: 'error',
            message: 'Tu sesion vencio. Inicia sesion de nuevo para crear una pyme.',
          })
          return
        }

        throw new Error(await getResponseErrorMessage(response, 'No se pudo crear la pyme.'))
      }

      const data = await response.json()
      const resolvedCreatedCategory = isRecord(data)
        ? data.category && typeof data.category === 'object'
          ? (data.category as PymeCategory)
          : selectedCategory ??
            (typeof data.category === 'string' ? data.category : null)
        : selectedCategory ?? null

      const createdPyme = isRecord(data)
        ? ({
            ...data,
            name,
            description,
            category: resolvedCreatedCategory,
          } as PymeRecord)
        : ({
            id: `new-${Date.now()}`,
            name,
            description,
            category: resolvedCreatedCategory,
            profile_pic: profilePicPreview ?? undefined,
            foundation_date: foundationDate,
          } as PymeRecord)

      setPymes((currentPymes) => [createdPyme, ...currentPymes].slice(0, 3))
      setTotalPymes((currentTotal) => currentTotal + 1)
      setCreatePymeForm({
        name: '',
        description: '',
        categoryId: '',
        foundationDate: '',
      })
      setProfilePicFile(null)
      setProfilePicPreview(null)
      
      setIsCreateMenuOpen(false)
      setErrorMessage(null)
    } catch (error) {
      setCreatePymeFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Ocurrio un error al crear la pyme.',
      })
    } finally {
      setIsCreatingPyme(false)
    }
  }

  const createMenu = (
    <div className="w-full rounded-[1.75rem] border border-border/80 bg-background/80 p-4 shadow-sm backdrop-blur">
      <button
        type="button"
        onClick={toggleCreateMenu}
        className="flex w-full items-center justify-between gap-3 rounded-2xl bg-card px-4 py-3 text-left transition-colors hover:bg-muted/60"
        aria-expanded={isCreateMenuOpen}
      >
        <div>
          <p className="text-sm font-semibold tracking-tight text-foreground">Crear nueva pyme</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Despliega un formulario rapido y agregala sin salir de esta vista.
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <PlusCircle className="size-4" />
          Crear
          <ChevronDown
            className={`size-4 transition-transform ${isCreateMenuOpen ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      {createPymeFeedback ? (
        <div
          className={`mt-3 rounded-2xl border px-4 py-3 text-sm ${
            createPymeFeedback.type === 'success'
              ? 'border-primary/20 bg-primary/10 text-foreground'
              : 'border-destructive/20 bg-destructive/10 text-foreground'
          }`}
        >
          {createPymeFeedback.message}
        </div>
      ) : null}

      {isCreateMenuOpen ? (
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={handleCreatePymeSubmit}>
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-foreground">Nombre</span>
            <input
              type="text"
              value={createPymeForm.name}
              onChange={(event) => handleCreatePymeFieldChange('name', event.target.value)}
              placeholder="Cafe del Barrio"
              className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-foreground">Categoria</span>
            <select
              value={createPymeForm.categoryId}
              onChange={(event) => handleCreatePymeFieldChange('categoryId', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">
                {isLoadingCategories ? 'Cargando categorias...' : 'Selecciona una categoria'}
              </option>
              {categories.map((category, index) => {
                const categoryId = getCategoryId(category)

                if (!categoryId) {
                  return null
                }

                return (
                  <option key={categoryId} value={categoryId}>
                    {getCategoryLabel(category, index)}
                  </option>
                )
              })}
            </select>
            {categoriesErrorMessage ? (
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-xs text-destructive">{categoriesErrorMessage}</p>
                <button
                  type="button"
                  onClick={handleRetryCategoriesLoad}
                  className="shrink-0 text-xs font-medium text-primary transition hover:opacity-80"
                >
                  Reintentar
                </button>
              </div>
            ) : null}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-foreground">Fecha de fundacion</span>
            <input
              type="date"
              required
              value={createPymeForm.foundationDate}
              onChange={(event) =>
                handleCreatePymeFieldChange('foundationDate', event.target.value)
              }
              className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-foreground">Descripcion</span>
            <textarea
              value={createPymeForm.description}
              onChange={(event) => handleCreatePymeFieldChange('description', event.target.value)}
              placeholder="Cuenta brevemente que hace tu pyme y como atiende a sus clientes."
              rows={4}
              className="mt-2 w-full resize-none rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-foreground">Imagen de perfil</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => handleProfilePicFileChange(event.target.files?.[0] ?? null)}
              className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Elige una foto desde tu dispositivo. La cargaremos junto con la pyme.
            </p>
            {profilePicFile ? (
              <div className="mt-3 flex items-center gap-3 rounded-2xl bg-background px-3 py-3 ring-1 ring-border">
                {profilePicPreview ? (
                  <img
                    src={profilePicPreview}
                    alt="Vista previa de la imagen seleccionada"
                    className="h-12 w-12 rounded-xl object-cover ring-1 ring-border"
                  />
                ) : null}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {profilePicFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(profilePicFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ) : null}
          </label>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={isCreatingPyme}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isCreatingPyme ? <LoaderCircle className="size-4 animate-spin" /> : <PlusCircle className="size-4" />}
              {isCreatingPyme ? 'Creando pyme...' : 'Guardar pyme'}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  )

  return (
    <section className="mx-auto w-full max-w-5xl px-6 pb-16 md:px-8 md:pb-20">
      <Reveal>
        <SectionHeading
          badge="Dashboard"
          title="Vista rapida de tus pymes"
          description="Aqui veras las pymes que tú creaste"
        />
      </Reveal>

      <div className="mt-8">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-48 animate-pulse rounded-3xl border border-border/70 bg-card/70"
              />
            ))}
          </div>
        ) : errorMessage ? (
          <Reveal>
            <div className="rounded-3xl border border-destructive/20 bg-card p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-destructive/10 p-3 text-destructive">
                  <CircleAlert className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">No pudimos cargar tus pymes</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{errorMessage}</p>
                </div>
              </div>
            </div>
          </Reveal>
        ) : pymes.length === 0 ? (
          <Reveal>
            <div className="rounded-3xl border border-border/80 bg-card p-8 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="max-w-2xl">
                  <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
                    <PlusCircle className="size-5" />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold tracking-tight">
                    Aun no tienes pymes registradas
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                    Este espacio esta listo para crecer contigo. Cuando crees una nueva pyme,
                    aparecera aqui de inmediato. Es un buen momento para empezar a agregar mas y
                    mantener todo mejor organizado.
                  </p>
                </div>

                <div className="w-full max-w-md space-y-3">
                  
                  {createMenu}
                </div>
              </div>
            </div>
          </Reveal>
        ) : (
          <>
            <Reveal>
              <div className="mb-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Mostrando las primeras {pymes.length} de {totalPymes} pymes registradas.
                </p>
                {createMenu}
              </div>
            </Reveal>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              
              {pymes.map((pyme, index) => {
                const name = getPymeName(pyme, index)
                const description = getPymeDescription(pyme)
                const tags = getPymeTags(pyme)
                const profilePicture = typeof pyme.profile_pic === 'string' ? pyme.profile_pic : ''

                return (
                  <Reveal key={String(pyme.id ?? name)} delay={0.06 * (index + 1)}>
                    <article className="h-full rounded-3xl border border-border/80 bg-card p-6 shadow-sm transition-transform duration-200 hover:-translate-y-1">
                      {profilePicture ? (
                        <img
                          src={profilePicture}
                          alt={name}
                          className="h-48 w-48 rounded-2xl object-cover ring-1 ring-border"
                        />
                      ) : (
                        <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
                          <Building2 className="size-5" />
                        </div>
                      )}

                      <h3 className="mt-4 text-lg font-semibold tracking-tight">{name}</h3>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {description}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-2">
                        {tags.length > 0 ? (
                          tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-background px-3 py-1 text-xs font-medium text-foreground/80 ring-1 ring-border"
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="rounded-full bg-background px-3 py-1 text-xs font-medium text-foreground/80 ring-1 ring-border">
                            Pyme activa en tu cuenta
                          </span>
                        )}
                      </div>
                    </article>
                  </Reveal>
                )
              })}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

export default PymeDashboard
