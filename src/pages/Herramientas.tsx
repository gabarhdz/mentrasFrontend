import { useEffect, useState } from 'react'
import {
  BarChart3,
  Building2,
  CircleAlert,
  Eye,
  LoaderCircle,
  Package,
  RefreshCw,
  Sparkles,
  Tags,
  TrendingUp,
  Workflow,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import {
  ToolsHeroCard,
  ToolsMetricCard,
  ToolsProgressCard,
  ToolsStoryCard,
} from '@/components/tools/tools-metrics'
import Footer from '@/components/ui/Footer'
import Header from '@/components/ui/Header'
import { Reveal } from '@/components/ui/reveal'
import { SectionHeading } from '@/components/ui/section-heading'
import { authFetch, clearAuthTokens, hasStoredSession } from '@/lib/auth'
import { buildBackendUrl } from '@/lib/utils'

type PymeCategory = {
  id?: string
  name?: string
  title?: string
}

type PymeSummary = {
  id?: string
  name?: string
  description?: string
  category?: PymeCategory | string | null
  profile_pic?: string
  access_date?: string
  foundation_date?: string
}

type MonthlySalesMetric = {
  month?: string
  sales?: number
}

type MostSoldProductMetric = {
  product_name?: string
  quantity_sold?: number
  profit?: number
}

type MostSeenProductMetric = {
  product_name?: string
  views?: number
}

type MostSoldCategoryMetric = {
  category_name?: string
  quantity_sold?: number
  profit?: number
}

type PymeMetrics = {
  pyme?: string
  monthly_sales: MonthlySalesMetric[]
  most_sold_products: MostSoldProductMetric[]
  most_seen_products: MostSeenProductMetric[]
  most_sold_categories: MostSoldCategoryMetric[]
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const toPymeArray = (value: unknown): PymeSummary[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(isRecord) as PymeSummary[]
}

const normalizePymesResponse = (payload: unknown) => {
  if (Array.isArray(payload)) {
    return toPymeArray(payload)
  }

  if (!isRecord(payload)) {
    return []
  }

  const possibleLists = [payload.results, payload.data, payload.items, payload.pymes]

  for (const candidate of possibleLists) {
    if (Array.isArray(candidate)) {
      return toPymeArray(candidate)
    }
  }

  return []
}

const toMonthlySalesArray = (value: unknown): MonthlySalesMetric[] =>
  Array.isArray(value) ? (value.filter(isRecord) as MonthlySalesMetric[]) : []

const toMostSoldProductsArray = (value: unknown): MostSoldProductMetric[] =>
  Array.isArray(value) ? (value.filter(isRecord) as MostSoldProductMetric[]) : []

const toMostSeenProductsArray = (value: unknown): MostSeenProductMetric[] =>
  Array.isArray(value) ? (value.filter(isRecord) as MostSeenProductMetric[]) : []

const toMostSoldCategoriesArray = (value: unknown): MostSoldCategoryMetric[] =>
  Array.isArray(value) ? (value.filter(isRecord) as MostSoldCategoryMetric[]) : []

const normalizeMetricsResponse = (payload: unknown): PymeMetrics => {
  if (!isRecord(payload)) {
    return {
      monthly_sales: [],
      most_sold_products: [],
      most_seen_products: [],
      most_sold_categories: [],
    }
  }

  return {
    pyme: typeof payload.pyme === 'string' ? payload.pyme : undefined,
    monthly_sales: toMonthlySalesArray(payload.monthly_sales),
    most_sold_products: toMostSoldProductsArray(payload.most_sold_products),
    most_seen_products: toMostSeenProductsArray(payload.most_seen_products),
    most_sold_categories: toMostSoldCategoriesArray(payload.most_sold_categories),
  }
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

const redirectToAuth = () => {
  clearAuthTokens()
  window.location.href = '/auth'
}

const ensureSuccessfulResponse = async (response: Response, fallbackMessage: string) => {
  if (response.status === 401) {
    redirectToAuth()
    throw new Error('Tu sesion vencio. Inicia sesion otra vez.')
  }

  if (!response.ok) {
    throw new Error(await getResponseErrorMessage(response, fallbackMessage))
  }

  return response
}

const fetchOwnedPymes = async () => {
  const response = await authFetch(buildBackendUrl('/api/pyme/my/'))
  await ensureSuccessfulResponse(response, 'No se pudieron cargar tus pymes.')
  return normalizePymesResponse(await response.json())
}

const fetchPymeMetrics = async (pymeId: string, refresh = false) => {
  const refreshQuery = refresh ? '?refresh=true' : ''
  const response = await authFetch(buildBackendUrl(`/api/tools/pymes/${pymeId}/metrics/${refreshQuery}`))
  await ensureSuccessfulResponse(response, 'No se pudieron cargar las metricas de esta pyme.')
  return normalizeMetricsResponse(await response.json())
}

const getCategoryLabel = (value?: PymeCategory | string | null) => {
  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }

  if (value && typeof value === 'object') {
    if (typeof value.name === 'string' && value.name.trim()) {
      return value.name.trim()
    }

    if (typeof value.title === 'string' && value.title.trim()) {
      return value.title.trim()
    }
  }

  return 'Sin categoria'
}

const toFiniteNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

const formatNumber = (value: number, options?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat('es-CR', {
    maximumFractionDigits: 0,
    ...options,
  }).format(value)

const formatAmount = (value: number) =>
  new Intl.NumberFormat('es-CR', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value)

const formatPercent = (value: number) =>
  `${new Intl.NumberFormat('es-CR', { maximumFractionDigits: 0 }).format(value)}%`

const formatMonthLabel = (value?: string) => {
  if (!value) {
    return 'Sin datos'
  }

  const [year, month] = value.split('-')

  if (!year || !month) {
    return value
  }

  const parsedDate = new Date(`${year}-${month}-01T00:00:00`)

  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('es-CR', {
    month: 'short',
    year: 'numeric',
  }).format(parsedDate)
}

const formatFoundationDate = (value?: string) => {
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

const getChangeLabel = (currentValue: number, previousValue: number) => {
  if (currentValue <= 0 && previousValue <= 0) {
    return undefined
  }

  if (previousValue <= 0) {
    return 'Primer movimiento'
  }

  const delta = ((currentValue - previousValue) / previousValue) * 100

  if (!Number.isFinite(delta)) {
    return undefined
  }

  const roundedDelta = Math.round(delta)

  if (roundedDelta === 0) {
    return 'Sin cambio'
  }

  return `${roundedDelta > 0 ? '+' : ''}${roundedDelta}%`
}

export default function Herramientas() {
  const [pymes, setPymes] = useState<PymeSummary[]>([])
  const [selectedPymeId, setSelectedPymeId] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<PymeMetrics | null>(null)
  const [isLoadingPymes, setIsLoadingPymes] = useState(true)
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false)
  const [isRefreshingMetrics, setIsRefreshingMetrics] = useState(false)
  const [pymesError, setPymesError] = useState<string | null>(null)
  const [metricsError, setMetricsError] = useState<string | null>(null)

  useEffect(() => {
    if (!hasStoredSession()) {
      redirectToAuth()
      return
    }

    const loadPymes = async () => {
      try {
        setIsLoadingPymes(true)
        setPymesError(null)
        const nextPymes = await fetchOwnedPymes()
        setPymes(nextPymes)
        setSelectedPymeId((currentPymeId) => currentPymeId ?? nextPymes[0]?.id ?? null)
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'No se pudieron cargar tus pymes.'
        setPymesError(message)
      } finally {
        setIsLoadingPymes(false)
      }
    }

    void loadPymes()
  }, [])

  useEffect(() => {
    if (!selectedPymeId) {
      setMetrics(null)
      return
    }

    let isCancelled = false

    const loadMetrics = async () => {
      try {
        setIsLoadingMetrics(true)
        setMetricsError(null)
        const nextMetrics = await fetchPymeMetrics(selectedPymeId)

        if (!isCancelled) {
          setMetrics(nextMetrics)
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'No se pudieron cargar las metricas de esta pyme.'

        if (!isCancelled && message !== 'Tu sesion vencio. Inicia sesion otra vez.') {
          setMetrics(null)
          setMetricsError(message)
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingMetrics(false)
        }
      }
    }

    void loadMetrics()

    return () => {
      isCancelled = true
    }
  }, [selectedPymeId])

  const handleRefreshMetrics = async () => {
    if (!selectedPymeId || isRefreshingMetrics) {
      return
    }

    try {
      setIsRefreshingMetrics(true)
      setMetricsError(null)
      const nextMetrics = await fetchPymeMetrics(selectedPymeId, true)
      setMetrics(nextMetrics)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudieron actualizar las metricas de esta pyme.'

      if (message !== 'Tu sesion vencio. Inicia sesion otra vez.') {
        setMetricsError(message)
      }
    } finally {
      setIsRefreshingMetrics(false)
    }
  }

  const selectedPyme = pymes.find((pyme) => pyme.id === selectedPymeId) ?? pymes[0] ?? null
  const monthlySales = metrics?.monthly_sales ?? []
  const mostSoldProducts = metrics?.most_sold_products ?? []
  const mostSeenProducts = metrics?.most_seen_products ?? []
  const mostSoldCategories = metrics?.most_sold_categories ?? []

  const totalSales = monthlySales.reduce((sum, item) => sum + toFiniteNumber(item.sales), 0)
  const currentMonthSales = toFiniteNumber(monthlySales[0]?.sales)
  const previousMonthSales = toFiniteNumber(monthlySales[1]?.sales)
  const totalSoldUnits = mostSoldProducts.reduce(
    (sum, item) => sum + toFiniteNumber(item.quantity_sold),
    0,
  )
  const totalViews = mostSeenProducts.reduce((sum, item) => sum + toFiniteNumber(item.views), 0)
  const totalCategoryUnits = mostSoldCategories.reduce(
    (sum, item) => sum + toFiniteNumber(item.quantity_sold),
    0,
  )

  const topSoldProduct = mostSoldProducts[0] ?? null
  const topSeenProduct = mostSeenProducts[0] ?? null
  const topCategory = mostSoldCategories[0] ?? null
  const strongestMonth = monthlySales.reduce<MonthlySalesMetric | null>((best, item) => {
    if (!best) {
      return item
    }

    return toFiniteNumber(item.sales) > toFiniteNumber(best.sales) ? item : best
  }, null)

  const topSoldShare =
    totalSoldUnits > 0 ? Math.round((toFiniteNumber(topSoldProduct?.quantity_sold) / totalSoldUnits) * 100) : 0
  const topSeenShare =
    totalViews > 0 ? Math.round((toFiniteNumber(topSeenProduct?.views) / totalViews) * 100) : 0
  const topCategoryShare =
    totalCategoryUnits > 0
      ? Math.round((toFiniteNumber(topCategory?.quantity_sold) / totalCategoryUnits) * 100)
      : 0

  const metricCards = [
    {
      icon: BarChart3,
      label: 'Ventas registradas',
      value: formatAmount(totalSales),
      description:
        monthlySales.length > 0
          ? `Tu referencia mas reciente es ${formatMonthLabel(monthlySales[0]?.month)} con ${formatAmount(currentMonthSales)} en ventas.`
          : 'Todavia no hay ventas registradas para armar una lectura del movimiento.',
      change: getChangeLabel(currentMonthSales, previousMonthSales),
      tone: 'primary' as const,
    },
    {
      icon: Package,
      label: 'Producto con mayor salida',
      value: topSoldProduct?.product_name || 'Sin ventas aun',
      description: topSoldProduct
        ? `${formatNumber(toFiniteNumber(topSoldProduct.quantity_sold))} unidades vendidas y ${formatAmount(toFiniteNumber(topSoldProduct.profit))} generados por este producto.`
        : 'Cuando haya ventas, aqui veras con claridad que producto mueve mas tu negocio.',
      change: topSoldProduct
        ? `${formatNumber(toFiniteNumber(topSoldProduct.quantity_sold))} uds`
        : undefined,
      tone: 'secondary' as const,
    },
    {
      icon: Eye,
      label: 'Interes en tu catalogo',
      value: formatNumber(totalViews),
      description: topSeenProduct
        ? `${topSeenProduct.product_name} es el producto que mas curiosidad genera con ${formatNumber(toFiniteNumber(topSeenProduct.views))} vistas.`
        : 'Todavia no hay suficientes visitas para detectar que producto llama mas la atencion.',
      change: topSeenProduct
        ? `${formatNumber(toFiniteNumber(topSeenProduct.views))} vistas`
        : undefined,
      tone: 'accent' as const,
    },
  ]

  const storyItems = [
    {
      label: 'Mes mas fuerte',
      value: strongestMonth ? formatMonthLabel(strongestMonth.month) : 'Sin historial',
      helper: strongestMonth
        ? `Hasta ahora ha sido tu mejor momento con ${formatAmount(toFiniteNumber(strongestMonth.sales))} en ventas.`
        : 'Todavia no hay suficiente recorrido para señalar un mes destacado.',
    },
    {
      label: 'Categoria que mejor se mueve',
      value: topCategory?.category_name || 'Sin datos aun',
      helper: topCategory
        ? `${formatNumber(toFiniteNumber(topCategory.quantity_sold))} unidades vendidas dentro de esta categoria.`
        : 'Cuando haya mas movimiento, aqui veras donde se esta concentrando la demanda.',
    },
    {
      label: 'Producto que mas atrae',
      value: topSeenProduct?.product_name || 'Sin datos aun',
      helper: topSeenProduct
        ? `${formatNumber(toFiniteNumber(topSeenProduct.views))} vistas acumuladas lo ponen al frente en interes del catalogo.`
        : 'Aun no hay suficiente actividad para detectar que producto despierta mas interes.',
    },
  ]

  const progressItems = [
    {
      label: 'Peso de tu producto principal',
      value: topSoldShare,
      helper:
        topSoldShare > 0
          ? `${topSoldProduct?.product_name || 'Tu producto lider'} representa ${formatPercent(topSoldShare)} de las unidades vendidas.`
          : 'Todavia no hay ventas suficientes para medir cuanto pesa tu producto principal.',
    },
    {
      label: 'Interes concentrado en un producto',
      value: topSeenShare,
      helper:
        topSeenShare > 0
          ? `${topSeenProduct?.product_name || 'Tu producto mas visto'} concentra ${formatPercent(topSeenShare)} de las vistas.`
          : 'Aun no hay vistas suficientes para entender como se reparte el interes.',
    },
    {
      label: 'Fuerza de tu categoria lider',
      value: topCategoryShare,
      helper:
        topCategoryShare > 0
          ? `${topCategory?.category_name || 'La categoria lider'} concentra ${formatPercent(topCategoryShare)} del volumen vendido por categoria.`
          : 'Cuando crezca la actividad, aqui sera mas facil ver si dependes de una sola categoria o no.',
    },
  ]

  const monthlySalesPreview = monthlySales.slice(0, 4).reverse()
  const maxPreviewSales = Math.max(
    1,
    ...monthlySalesPreview.map((item) => toFiniteNumber(item.sales)),
  )

  const heroHighlights = [
    getCategoryLabel(selectedPyme?.category),
    monthlySales.length > 0 ? `${monthlySales.length} meses con historial` : 'Historial en construccion',
    mostSeenProducts.length > 0
      ? `${formatNumber(totalViews)} vistas registradas`
      : 'Aun sin vistas registradas',
  ]

  const foundationDateLabel = formatFoundationDate(selectedPyme?.foundation_date)

  return (
    <main className="relative min-h-screen text-foreground">
      <Header />
      <section className="px-6 py-10 md:px-12 md:py-14 lg:px-24 xl:px-40">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            badge="Herramientas"
            title="Una lectura clara de como se esta moviendo cada pyme"
            description="Revisamos la actividad de tus productos y ventas para convertirla en un resumen que te ayude a decidir rapido, sin ponerte a interpretar tablas."
          />

          <button
            type="button"
            onClick={handleRefreshMetrics}
            disabled={!selectedPymeId || isLoadingMetrics || isRefreshingMetrics}
            className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRefreshingMetrics ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            {isRefreshingMetrics ? 'Actualizando vista...' : 'Actualizar vista'}
          </button>
        </div>

        {isLoadingPymes ? (
          <div className="mt-10 space-y-6">
            <div className="h-12 w-full max-w-xl animate-pulse rounded-full border border-border/70 bg-card/70" />
            <div className="h-[320px] animate-pulse rounded-[2rem] border border-border/70 bg-card/70" />
            <div className="grid gap-5 md:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-48 animate-pulse rounded-[1.5rem] border border-border/70 bg-card/70"
                />
              ))}
            </div>
          </div>
        ) : pymesError ? (
          <Reveal className="mt-10">
            <div className="rounded-[1.75rem] border border-destructive/20 bg-card p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-destructive/10 p-3 text-destructive">
                  <CircleAlert className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">
                    No pudimos cargar tus herramientas
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{pymesError}</p>
                </div>
              </div>
            </div>
          </Reveal>
        ) : pymes.length === 0 ? (
          <Reveal className="mt-10">
            <div className="rounded-[1.75rem] border border-border bg-card p-8 shadow-sm">
              <div className="max-w-2xl">
                <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
                  <Building2 className="size-5" />
                </div>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight">
                  Aun no tienes una pyme lista para esta vista
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                  En cuanto tengas una pyme creada, aqui podras ver un resumen claro de ventas,
                  productos con mas salida e interes del catalogo.
                </p>
                <Link
                  to="/pymes"
                  className="mt-6 inline-flex items-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-105"
                >
                  Ir a mis pymes
                </Link>
              </div>
            </div>
          </Reveal>
        ) : (
          <>
            <Reveal className="mt-8">
              <div className="flex flex-wrap gap-3">
                {pymes.map((pyme) => {
                  const isActive = pyme.id === selectedPymeId

                  return (
                    <button
                      key={pyme.id || pyme.name}
                      type="button"
                      onClick={() => setSelectedPymeId(pyme.id ?? null)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-foreground hover:bg-muted'
                      }`}
                    >
                      {pyme.name || 'Pyme sin nombre'}
                    </button>
                  )
                })}
              </div>
            </Reveal>

            <Reveal className="mt-8">
              <ToolsHeroCard
                eyebrow={selectedPyme?.name || 'Resumen de tu pyme'}
                title={
                  selectedPyme
                    ? `Asi se esta moviendo ${selectedPyme.name || 'tu pyme'}`
                    : 'Asi se estan moviendo tus herramientas'
                }
                description={
                  selectedPyme?.description?.trim()
                    ? selectedPyme.description
                    : 'Esta vista resume donde ya hay traccion, que producto destaca y como se esta repartiendo el interes.'
                }
                highlights={heroHighlights}
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">
                      Actividad reciente
                    </p>
                    {foundationDateLabel ? (
                      <span className="rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                        Desde {foundationDateLabel}
                      </span>
                    ) : null}
                  </div>

                  {monthlySalesPreview.length > 0 ? (
                    <div className="mt-5 flex items-end gap-3">
                      {monthlySalesPreview.map((item) => {
                        const salesValue = toFiniteNumber(item.sales)
                        const height = Math.max(24, Math.round((salesValue / maxPreviewSales) * 110))

                        return (
                          <div key={item.month} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                            <div className="text-xs font-semibold text-foreground">
                              {formatAmount(salesValue)}
                            </div>
                            <div className="flex h-28 w-full items-end justify-center rounded-[1.25rem] bg-background/70 px-2 py-2">
                              <div
                                className="w-full rounded-full bg-[linear-gradient(180deg,var(--primary),color-mix(in_oklab,var(--accent)_70%,white))]"
                                style={{ height }}
                              />
                            </div>
                            <div className="text-center text-xs text-muted-foreground">
                              {formatMonthLabel(item.month)}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="mt-5 rounded-[1.25rem] border border-border/70 bg-background/70 p-4 text-sm leading-6 text-muted-foreground">
                      Aun no hay suficientes movimientos para mostrar una tendencia mensual, pero
                      esta vista ya quedo preparada para reflejarla apenas exista actividad.
                    </div>
                  )}
                </div>
              </ToolsHeroCard>
            </Reveal>

            {metricsError ? (
              <Reveal className="mt-8">
                <div className="rounded-[1.75rem] border border-destructive/20 bg-card p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl bg-destructive/10 p-3 text-destructive">
                      <CircleAlert className="size-5" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold tracking-tight">
                        No pudimos leer las metricas de esta pyme
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {metricsError}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ) : null}

            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {isLoadingMetrics
                ? [0, 1, 2].map((index) => (
                  <div
                    key={index}
                    className="h-48 animate-pulse rounded-[1.5rem] border border-border/70 bg-card/70"
                  />
                  ))
                : metricCards.map((metric, index) => (
                  <Reveal key={metric.label} delay={0.06 * (index + 1)}>
                    <ToolsMetricCard {...metric} />
                  </Reveal>
                  ))}
            </div>

            <div className="mt-16">
              <SectionHeading
                badge="Lectura amigable"
                title="Lo mas importante, explicado en simple"
                description="En vez de mostrarte un tablero frio, esta seccion resume donde se esta concentrando el movimiento y que te conviene mirar primero."
              />

              <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                {isLoadingMetrics ? (
                  <>
                    <div className="h-[380px] animate-pulse rounded-[1.75rem] border border-border/70 bg-card/70" />
                    <div className="h-[380px] animate-pulse rounded-[1.75rem] border border-border/70 bg-card/70" />
                  </>
                ) : (
                  <>
                    <Reveal delay={0.12}>
                      <ToolsStoryCard
                        icon={Sparkles}
                        title="Lo que te conviene mirar primero"
                        description="Tres pistas concretas para entender rapido donde ya hay avance y que te esta generando mejores señales."
                        items={storyItems}
                        tone="accent"
                      />
                    </Reveal>

                    <Reveal delay={0.18}>
                      <ToolsProgressCard
                        icon={Workflow}
                        title="Como se reparte el movimiento"
                        description="Aqui ves si tu actividad esta diversificada o si depende demasiado de un solo producto o categoria."
                        items={progressItems}
                        footer="Esta lectura ayuda a detectar si conviene reforzar lo que ya funciona o abrir mas espacio para otros productos dentro de tu catalogo."
                      />
                    </Reveal>
                  </>
                )}
              </div>
            </div>

            <Reveal delay={0.22} className="mt-16">
              <div className="rounded-[1.75rem] border border-border bg-card p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div className="max-w-2xl">
                    <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">
                      Resumen general
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                      Una vista para decidir con mas claridad
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                      {selectedPyme?.name || 'Tu pyme'} ya tiene un resumen conectado a datos
                      reales. Puedes cambiar entre tus pymes y actualizar la vista para revisar
                      como se mueve cada una.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                    <TrendingUp className="size-4" />
                    {topCategory?.category_name
                      ? `${topCategory.category_name} va liderando`
                      : 'Lectura lista para crecer'}
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4">
                    <div className="inline-flex rounded-2xl bg-primary/10 p-2.5 text-primary">
                      <BarChart3 className="size-4" />
                    </div>
                    <p className="mt-3 text-sm font-medium text-foreground">Ventas acumuladas</p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight">
                      {formatAmount(totalSales)}
                    </p>
                  </div>

                  <div className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4">
                    <div className="inline-flex rounded-2xl bg-secondary/20 p-2.5 text-secondary-foreground">
                      <Package className="size-4" />
                    </div>
                    <p className="mt-3 text-sm font-medium text-foreground">Unidades vendidas</p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight">
                      {formatNumber(totalSoldUnits)}
                    </p>
                  </div>

                  <div className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4">
                    <div className="inline-flex rounded-2xl bg-accent/15 p-2.5 text-accent">
                      <Tags className="size-4" />
                    </div>
                    <p className="mt-3 text-sm font-medium text-foreground">Categoria destacada</p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight">
                      {topCategory?.category_name || 'Sin datos'}
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          </>
        )}
      </section>
      <Footer />
    </main>
  )
}
