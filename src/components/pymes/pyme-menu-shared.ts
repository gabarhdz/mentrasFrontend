import { buildBackendUrl } from '@/lib/utils'

export type UserProfile = {
  id?: string
  is_pyme_owner?: boolean
}

export type StockItem = {
  id: string
  name: string
  profile_pic?: string | null
  price?: string | number | null
  stock?: number | null
}

export type MenuItem = {
  id: string
  menu?: string
  item?: StockItem | null
  quantity?: number | null
}

export type MenuMovement = {
  id: string
  menu?: string
  menu_name?: string
  item?: StockItem | null
  item_name?: string | null
  performed_by?: string | null
  action?: string | null
  action_display?: string | null
  quantity?: number | null
  previous_quantity?: number | null
  details?: string | null
  created_at?: string | null
}

export type StockMenu = {
  id: string
  pyme?: string
  pymeName?: string
  name: string
  description: string
  menu_items: MenuItem[]
  movements: MenuMovement[]
}

export type OwnedPymeOption = {
  id: string
  name: string
}

export type FeedbackState = {
  type: 'success' | 'error'
  message: string
}

export type CreateItemForm = {
  name: string
  price: string
  stock: string
}

export type CreateMenuForm = {
  pymeId: string
  name: string
  description: string
}

export type MenuEditorState = {
  itemId: string
  quantity: string
}

export const emptyMenuEditor: MenuEditorState = {
  itemId: '',
  quantity: '1',
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

export const resolveMediaUrl = (value?: string | null) => {
  if (!value) {
    return null
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value
  }

  return buildBackendUrl(value)
}

export const formatPrice = (value?: string | number | null) => {
  const resolvedValue = resolveNumber(value)

  if (resolvedValue === null) {
    return 'Precio no disponible'
  }

  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    maximumFractionDigits: 2,
  }).format(resolvedValue)
}

export const formatDateTime = (value?: string | null) => {
  if (!value) {
    return 'Sin fecha'
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Sin fecha'
  }

  return new Intl.DateTimeFormat('es-CR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsedDate)
}

export const getStockTone = (stock: number) => {
  if (stock <= 0) {
    return 'border-destructive/25 bg-destructive/10 text-foreground'
  }

  if (stock <= 5) {
    return 'border-amber-200 bg-amber-50 text-amber-800'
  }

  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}
