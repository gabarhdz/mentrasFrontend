import { useEffect, useState } from 'react'
import { Building2, CircleAlert, PlusCircle } from 'lucide-react'

import { Reveal } from '@/components/ui/reveal'
import { SectionHeading } from '@/components/ui/section-heading'
import { authFetch, clearAuthTokens, hasStoredSession } from '@/lib/auth'
import { buildBackendUrl } from '@/lib/utils'

type PymeRecord = Record<string, unknown> & {
  id?: number | string
}

type PymeCollection = {
  items: PymeRecord[]
  total: number
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const toPymeArray = (value: unknown): PymeRecord[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(isRecord) as PymeRecord[]
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

const getPymeName = (pyme: PymeRecord, index: number) =>
  getTextValue(pyme, ['name', 'nombre', 'business_name', 'company_name', 'title']) ||
  `Pyme ${index + 1}`

const getPymeDescription = (pyme: PymeRecord) =>
  getTextValue(pyme, ['description', 'descripcion', 'summary', 'about']) ||
  'Tu pyme ya esta registrada y lista para seguir creciendo dentro de Mentras.'

const getPymeTags = (pyme: PymeRecord) =>
  [
    getTextValue(pyme, ['status', 'estado']),
    getTextValue(pyme, ['category', 'categoria', 'sector', 'industry']),
    getTextValue(pyme, ['city', 'ciudad', 'location', 'ubicacion']),
  ].filter((value): value is string => Boolean(value))

const PymeDashboard = () => {
  const [pymes, setPymes] = useState<PymeRecord[]>([])
  const [totalPymes, setTotalPymes] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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

  return (
    <section className="mx-auto w-full max-w-5xl px-6 pb-16 md:px-8 md:pb-20">
      <Reveal>
        <SectionHeading
          badge="Dashboard"
          title="Vista rapida de tus pymes"
          description="Aqui veras si ya tienes pymes registradas. Si existen, mostramos las primeras tres para que tengas una referencia rapida."
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

                <div className="rounded-2xl bg-background px-4 py-3 text-sm font-medium text-foreground/80">
                  Sin pymes por ahora
                </div>
              </div>
            </div>
          </Reveal>
        ) : (
          <>
            <Reveal>
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Mostrando las primeras {pymes.length} de {totalPymes} pymes registradas.
                </p>
              </div>
            </Reveal>

            <div className="grid gap-4 md:grid-cols-3">
              {pymes.map((pyme, index) => {
                const name = getPymeName(pyme, index)
                const description = getPymeDescription(pyme)
                const tags = getPymeTags(pyme)

                return (
                  <Reveal key={String(pyme.id ?? name)} delay={0.06 * (index + 1)}>
                    <article className="h-full rounded-3xl border border-border/80 bg-card p-6 shadow-sm transition-transform duration-200 hover:-translate-y-1">
                      <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
                        <Building2 className="size-5" />
                      </div>

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
