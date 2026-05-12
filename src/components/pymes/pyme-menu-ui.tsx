import { useState, type FormEventHandler, type ReactNode } from 'react'
import {
  ChevronDown,
  Clock3,
  Download,
  Eye,
  LoaderCircle,
  Package2,
  PlusCircle,
  Share2,
  type LucideIcon,
  X,
} from 'lucide-react'

import { cn } from '@/lib/utils'

import type {
  FeedbackState,
  MenuEditorState,
  MenuMovement,
  StockItem,
  StockMenu,
} from '@/components/pymes/pyme-menu-shared'
import {
  formatDateTime,
  formatPrice,
  getStockTone,
  resolveMediaUrl,
} from '@/components/pymes/pyme-menu-shared'
import {
  canShareMenuPdf,
  downloadMenuPdf,
  shareMenuPdf,
} from '@/components/pymes/pyme-menu-pdf'

type DashboardMetricCardProps = {
  icon: LucideIcon
  label: string
  value: ReactNode
}

export function DashboardMetricCard({
  icon: Icon,
  label,
  value,
}: DashboardMetricCardProps) {
  return (
    <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
      <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
        <Icon className="size-5" />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{label}</p>
      <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
    </div>
  )
}

type DashboardDisclosureSectionProps = {
  badge: string
  title: string
  description: string
  isOpen: boolean
  onToggle: () => void
  children: ReactNode
  actions?: ReactNode
  collapsedSummary?: string
}

export function DashboardDisclosureSection({
  badge,
  title,
  description,
  isOpen,
  onToggle,
  children,
  actions,
  collapsedSummary,
}: DashboardDisclosureSectionProps) {
  return (
    <div className="rounded-[1.9rem] border border-border/80 bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">{badge}</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight">{title}</h3>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {actions}
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            aria-expanded={isOpen}
          >
            {isOpen ? 'Ocultar' : 'Desplegar'}
            <ChevronDown className={cn('size-4 transition-transform', isOpen && 'rotate-180')} />
          </button>
        </div>
      </div>

      {isOpen ? (
        <div className="mt-6">{children}</div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-background/70 px-4 py-4">
          <p className="text-sm text-muted-foreground">
            {collapsedSummary || 'Despliega esta seccion para ver mas detalle.'}
          </p>
        </div>
      )}
    </div>
  )
}

type InventoryItemCardProps = {
  item: StockItem
}

export function InventoryItemCard({ item }: InventoryItemCardProps) {
  const imageUrl = resolveMediaUrl(item.profile_pic)
  const stock = item.stock ?? 0

  return (
    <article className="rounded-3xl border border-border/80 bg-background/70 p-4 shadow-sm">
      <div className="flex items-start gap-4">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.name}
            className="h-16 w-16 rounded-2xl object-cover ring-1 ring-border"
          />
        ) : (
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Package2 className="size-5" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h4 className="text-base font-semibold tracking-tight">{item.name}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{formatPrice(item.price)}</p>
            </div>
            <span
              className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${getStockTone(stock)}`}
            >
              Stock disponible: {stock}
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}

type MovementRecordCardProps = {
  movement: MenuMovement
  showMenuName?: boolean
  showStockAfter?: boolean
  compact?: boolean
}

export function MovementRecordCard({
  movement,
  showMenuName = true,
  showStockAfter = true,
  compact = false,
}: MovementRecordCardProps) {
  return (
    <article
      className={cn(
        'rounded-3xl border border-border/80 bg-background/70 shadow-sm',
        compact ? 'p-4' : 'p-4',
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-card px-3 py-1 text-xs font-semibold text-primary ring-1 ring-primary/20">
              {movement.action_display || 'Movimiento'}
            </span>
            {showMenuName && movement.menu_name ? (
              <span className="rounded-full bg-card px-3 py-1 text-xs font-medium text-foreground/80 ring-1 ring-border">
                {movement.menu_name}
              </span>
            ) : null}
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {movement.details || 'Sin detalle adicional.'}
          </p>
        </div>
        <span className="rounded-full bg-card px-3 py-1 text-xs font-medium text-foreground/80 ring-1 ring-border">
          {formatDateTime(movement.created_at)}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {movement.item_name ? (
          <span className="rounded-full bg-card px-3 py-1 text-xs font-medium text-foreground/80 ring-1 ring-border">
            Item: {movement.item_name}
          </span>
        ) : null}
        {movement.quantity !== null && movement.quantity !== undefined ? (
          <span className="rounded-full bg-card px-3 py-1 text-xs font-medium text-foreground/80 ring-1 ring-border">
            Cantidad: {movement.quantity}
          </span>
        ) : null}
        {movement.performed_by ? (
          <span className="rounded-full bg-card px-3 py-1 text-xs font-medium text-foreground/80 ring-1 ring-border">
            Hecho por: {movement.performed_by}
          </span>
        ) : null}
        {showStockAfter &&
        movement.item?.stock !== null &&
        movement.item?.stock !== undefined ? (
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStockTone(movement.item.stock)}`}
          >
            Stock despues del movimiento: {movement.item.stock}
          </span>
        ) : null}
      </div>
    </article>
  )
}

type MenuPdfActionsProps = {
  menu: StockMenu
  pymeName?: string | null
  showShare?: boolean
  compact?: boolean
}

function MenuPdfActions({
  menu,
  pymeName,
  showShare = true,
  compact = false,
}: MenuPdfActionsProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const shareEnabled = canShareMenuPdf()

  const handleDownload = async () => {
    setIsDownloading(true)
    setFeedback(null)

    try {
      const fileName = await downloadMenuPdf({ menu, pymeName })
      setFeedback({
        type: 'success',
        message: `El PDF ${fileName} ya se descargo para compartirlo o reenviarlo.`,
      })
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'No se pudo generar el PDF del menu.',
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleShare = async () => {
    setIsSharing(true)
    setFeedback(null)

    try {
      await shareMenuPdf({ menu, pymeName })
      setFeedback({
        type: 'success',
        message: 'El PDF se compartio usando las opciones disponibles en tu dispositivo.',
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setFeedback(null)
        return
      }

      setFeedback({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'No se pudo compartir el PDF de este menu.',
      })
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            void handleDownload()
          }}
          disabled={isDownloading || isSharing}
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-70',
            compact ? 'px-3 py-2 text-xs' : 'px-4 py-2 text-sm',
          )}
        >
          {isDownloading ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          {isDownloading ? 'Generando PDF...' : 'Descargar PDF'}
        </button>

        {showShare ? (
          <button
            type="button"
            onClick={() => {
              void handleShare()
            }}
            disabled={!shareEnabled || isDownloading || isSharing}
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-full border border-primary/20 bg-primary/10 font-semibold text-primary transition-colors hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-60',
              compact ? 'px-3 py-2 text-xs' : 'px-4 py-2 text-sm',
            )}
            title={
              !shareEnabled
                ? 'Esta opcion depende de que el navegador soporte Web Share para archivos.'
                : undefined
            }
          >
            {isSharing ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Share2 className="size-4" />
            )}
            {isSharing ? 'Compartiendo...' : 'Compartir PDF'}
          </button>
        ) : null}
      </div>

      {feedback ? (
        <div
          className={cn(
            'rounded-2xl border px-4 py-3 text-sm',
            feedback.type === 'success'
              ? 'border-primary/20 bg-primary/10 text-foreground'
              : 'border-destructive/20 bg-destructive/10 text-foreground',
          )}
        >
          {feedback.message}
        </div>
      ) : showShare && !shareEnabled ? (
        <p className="text-xs leading-5 text-muted-foreground">
          Compartir depende de un navegador compatible con Web Share y una conexion segura https.
        </p>
      ) : null}
    </div>
  )
}

type MenuSummaryCardProps = {
  menu: StockMenu
  pymeName?: string | null
  onOpenMenu: (menuId: string) => void
  onOpenRecords: (menuId: string) => void
}

export function MenuSummaryCard({
  menu,
  pymeName,
  onOpenMenu,
  onOpenRecords,
}: MenuSummaryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const itemCount = menu.menu_items.length
  const totalAssignedUnits = menu.menu_items.reduce(
    (total, menuItem) => total + (menuItem.quantity ?? 0),
    0,
  )
  const latestMovement = menu.movements[0]

  return (
    <article className="rounded-3xl border border-border/80 bg-background/70 p-5 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <div className="flex flex-wrap gap-2">
              <div className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold tracking-tight text-primary">
                Menu activo
              </div>
              {pymeName ? (
                <div className="inline-flex rounded-full border border-border bg-card px-3 py-1 text-xs font-medium tracking-tight text-foreground/80">
                  Pyme: {pymeName}
                </div>
              ) : null}
            </div>
            <h4 className="mt-3 text-xl font-semibold tracking-tight">{menu.name}</h4>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{menu.description}</p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => onOpenMenu(menu.id)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <Eye className="size-4" />
                Ver y editar
              </button>
              <button
                type="button"
                onClick={() => onOpenRecords(menu.id)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
              >
                <Clock3 className="size-4" />
                Ver registros
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded((currentState) => !currentState)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                aria-expanded={isExpanded}
              >
                {isExpanded ? 'Ocultar resumen' : 'Desplegar resumen'}
                <ChevronDown
                  className={cn('size-4 transition-transform', isExpanded && 'rotate-180')}
                />
              </button>
            </div>

            <MenuPdfActions menu={menu} pymeName={pymeName} showShare={false} compact />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-card px-3 py-1 text-xs font-medium text-foreground/80 ring-1 ring-border">
            {itemCount} {itemCount === 1 ? 'item' : 'items'} ligados
          </span>
          <span className="rounded-full bg-card px-3 py-1 text-xs font-medium text-foreground/80 ring-1 ring-border">
            {totalAssignedUnits} unidades asignadas
          </span>
          <span className="rounded-full bg-card px-3 py-1 text-xs font-medium text-foreground/80 ring-1 ring-border">
            {menu.movements.length} movimientos registrados
          </span>
        </div>

        {isExpanded ? (
          <div className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              {menu.menu_items.length > 0 ? (
                menu.menu_items.slice(0, 2).map((menuItem) => {
                  const item = menuItem.item
                  const stock = item?.stock ?? 0

                  return (
                    <div
                      key={menuItem.id}
                      className="rounded-2xl border border-border/70 bg-card px-4 py-4"
                    >
                      <p className="text-sm font-semibold text-foreground">
                        {item?.name || 'Item sin nombre'}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Precio actual: {formatPrice(item?.price)}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-background px-3 py-1 text-xs font-medium text-foreground/80 ring-1 ring-border">
                          En menu: {menuItem.quantity ?? 0}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStockTone(stock)}`}
                        >
                          Stock restante: {stock}
                        </span>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-5 md:col-span-2">
                  <p className="text-sm font-medium text-foreground">
                    Este menu aun no tiene items
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Abre el pop-up para agregar productos del inventario y empezar a mover stock
                    desde este menu.
                  </p>
                </div>
              )}

              {menu.menu_items.length > 2 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-4 md:col-span-2">
                  <p className="text-sm text-muted-foreground">
                    Hay {menu.menu_items.length - 2} items adicionales dentro de este menu. Abre
                    el detalle para verlos todos.
                  </p>
                </div>
              ) : null}
            </div>

            {latestMovement ? (
              <MovementRecordCard
                movement={latestMovement}
                showMenuName={false}
                showStockAfter={false}
                compact
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-4">
                <p className="text-sm text-muted-foreground">
                  Aun no hay registros operativos en este menu.
                </p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </article>
  )
}

type MenuDetailModalProps = {
  menu: StockMenu
  pymeName?: string | null
  items: StockItem[]
  editorState: MenuEditorState
  feedback?: FeedbackState | null
  isSaving: boolean
  onClose: () => void
  onOpenRecords: () => void
  onEditorChange: (field: keyof MenuEditorState, value: string) => void
  onSubmit: FormEventHandler<HTMLFormElement>
}

export function MenuDetailModal({
  menu,
  pymeName,
  items,
  editorState,
  feedback,
  isSaving,
  onClose,
  onOpenRecords,
  onEditorChange,
  onSubmit,
}: MenuDetailModalProps) {
  const selectedItem = items.find((item) => item.id === editorState.itemId) ?? null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-4 py-6 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-modal-title"
        className="relative max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-border/80 bg-card p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex items-center justify-center rounded-full border border-border bg-background p-2 text-foreground transition-colors hover:bg-muted"
          aria-label="Cerrar detalle del menu"
        >
          <X className="size-4" />
        </button>

        <div className="pr-12">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">
            Detalle del menu
          </p>
          <h3 id="menu-modal-title" className="mt-3 text-3xl font-semibold tracking-tight">
            {menu.name}
          </h3>
          {pymeName ? (
            <div className="mt-3 inline-flex rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground/80">
              Pertenece a: {pymeName}
            </div>
          ) : null}
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            {menu.description}
          </p>

          <div className="mt-4">
            <MenuPdfActions menu={menu} pymeName={pymeName} />
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <DashboardMetricCard
            icon={Package2}
            label="Items ligados"
            value={menu.menu_items.length}
          />
          <DashboardMetricCard
            icon={Clock3}
            label="Movimientos del menu"
            value={menu.movements.length}
          />
          <DashboardMetricCard
            icon={Eye}
            label="Ultimo registro"
            value={menu.movements[0] ? formatDateTime(menu.movements[0].created_at) : 'Sin movimientos'}
          />
        </div>

        {feedback ? (
          <div
            className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${
              feedback.type === 'success'
                ? 'border-primary/20 bg-primary/10 text-foreground'
                : 'border-destructive/20 bg-destructive/10 text-foreground'
            }`}
          >
            {feedback.message}
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div>
            <h4 className="text-lg font-semibold tracking-tight">Items del menu</h4>
            {menu.menu_items.length === 0 ? (
              <div className="mt-4 rounded-3xl border border-dashed border-border bg-background/70 px-4 py-6">
                <p className="text-sm font-medium text-foreground">Este menu aun no tiene items</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Usa el editor del lado derecho para agregar productos del inventario.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {menu.menu_items.map((menuItem) => {
                  const item = menuItem.item
                  const stock = item?.stock ?? 0
                  const imageUrl = resolveMediaUrl(item?.profile_pic)

                  return (
                    <article
                      key={menuItem.id}
                      className="rounded-3xl border border-border/80 bg-background/70 p-4 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={item?.name || 'Item del menu'}
                            className="h-14 w-14 rounded-2xl object-cover ring-1 ring-border"
                          />
                        ) : (
                          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Package2 className="size-4" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {item?.name || 'Item sin nombre'}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Precio actual: {formatPrice(item?.price)}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <span className="rounded-full bg-card px-3 py-1 text-xs font-medium text-foreground/80 ring-1 ring-border">
                                En menu: {menuItem.quantity ?? 0}
                              </span>
                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStockTone(stock)}`}
                              >
                                Stock restante: {stock}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>

          <div>
            <div className="rounded-[1.6rem] border border-border bg-background/70 p-4">
              <h4 className="text-lg font-semibold tracking-tight">Editor del menu</h4>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Cada alta descuenta stock en el backend y deja el registro operativo guardado
                automaticamente.
              </p>

              <form className="mt-4 grid gap-3" onSubmit={onSubmit}>
                <label className="block">
                  <span className="text-sm font-medium text-foreground">Item del inventario</span>
                  <select
                    value={editorState.itemId}
                    onChange={(event) => onEditorChange('itemId', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Selecciona un item</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} · stock {item.stock ?? 0}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-foreground">Cantidad</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={editorState.quantity}
                    onChange={(event) => onEditorChange('quantity', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isSaving || items.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSaving ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <PlusCircle className="size-4" />
                  )}
                  {isSaving ? 'Guardando...' : 'Agregar al menu'}
                </button>
              </form>

              <div className="mt-4 rounded-2xl bg-card px-4 py-4 ring-1 ring-border">
                <p className="text-sm font-medium text-foreground">Stock visible antes de confirmar</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {selectedItem
                    ? `${selectedItem.name} tiene ${selectedItem.stock ?? 0} unidades disponibles antes de este movimiento.`
                    : 'Selecciona un item para ver aqui el stock disponible antes de agregarlo al menu.'}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-[1.6rem] border border-border bg-background/70 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h4 className="text-lg font-semibold tracking-tight">
                    Registros recientes del menu
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Aqui ves el historial inmediato sin salir del pop-up.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenRecords}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
                >
                  <Clock3 className="size-4" />
                  Ir a registros
                </button>
              </div>

              {menu.movements.length === 0 ? (
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  Aun no hay movimientos registrados para este menu.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {menu.movements.slice(0, 4).map((movement) => (
                    <MovementRecordCard
                      key={movement.id}
                      movement={movement}
                      showMenuName={false}
                      showStockAfter={false}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
