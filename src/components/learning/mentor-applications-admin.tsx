import { useEffect, useState } from 'react'
import { CheckCircle2, Clock3, LoaderCircle, UserRoundCheck, XCircle } from 'lucide-react'

import { authFetch, clearAuthTokens } from '@/lib/auth'
import { buildBackendUrl } from '@/lib/utils'

type ApplicationStatus = 'pending' | 'approved' | 'rejected'
type ApplicationFilter = ApplicationStatus | 'all'

type MentorApplication = {
  id: number
  applicant: string
  applicant_username: string
  applicant_email: string
  expertise: string
  experience: string
  motivation: string
  status: ApplicationStatus
  created_at: string
}

type FeedbackState = {
  type: 'success' | 'error'
  message: string
}

const STATUS_COPY: Record<ApplicationStatus, string> = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
}

const formatDateTime = (value: string) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Fecha no disponible'
  }

  return new Intl.DateTimeFormat('es-CR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

const getResponseErrorMessage = async (response: Response, fallbackMessage: string) => {
  try {
    const data = await response.json()

    if (typeof data.error === 'string') return data.error
    if (typeof data.detail === 'string') return data.detail
    if (typeof data.message === 'string') return data.message

    if (data && typeof data === 'object') {
      const firstEntry = Object.entries(data)[0]
      const value = firstEntry?.[1]

      if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
      if (typeof value === 'string') return value
    }
  } catch {
    // El mensaje de respaldo explica el fallo cuando la respuesta no es JSON.
  }

  return fallbackMessage
}

export function MentorApplicationsAdminPanel() {
  const [filter, setFilter] = useState<ApplicationFilter>('pending')
  const [applications, setApplications] = useState<MentorApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeDecision, setActiveDecision] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)

  useEffect(() => {
    let isCurrent = true

    const loadApplications = async () => {
      setIsLoading(true)
      setFeedback(null)

      try {
        const query = filter === 'all' ? '' : `?status=${filter}`
        const response = await authFetch(buildBackendUrl(`/api/learning/mentor/applications/${query}`))

        if (response.status === 401) {
          clearAuthTokens()
          throw new Error('Tu sesion vencio. Inicia sesion de nuevo para gestionar solicitudes.')
        }

        if (!response.ok) {
          throw new Error(await getResponseErrorMessage(response, 'No se pudieron cargar las solicitudes.'))
        }

        const payload = await response.json()
        if (isCurrent) {
          setApplications(Array.isArray(payload) ? (payload as MentorApplication[]) : [])
        }
      } catch (error) {
        if (isCurrent) {
          setApplications([])
          setFeedback({
            type: 'error',
            message: error instanceof Error ? error.message : 'No se pudieron cargar las solicitudes.',
          })
        }
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    void loadApplications()

    return () => {
      isCurrent = false
    }
  }, [filter])

  const handleDecision = async (application: MentorApplication, status: 'approved' | 'rejected') => {
    setActiveDecision(application.id)
    setFeedback(null)

    try {
      const response = await authFetch(
        buildBackendUrl(`/api/learning/mentor/applications/${application.id}/`),
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        },
      )

      if (response.status === 401) {
        clearAuthTokens()
        throw new Error('Tu sesion vencio. Inicia sesion de nuevo para gestionar solicitudes.')
      }

      if (!response.ok) {
        throw new Error(await getResponseErrorMessage(response, 'No se pudo actualizar la solicitud.'))
      }

      const updatedApplication = (await response.json()) as MentorApplication
      setApplications((currentApplications) =>
        filter === 'pending'
          ? currentApplications.filter((currentApplication) => currentApplication.id !== application.id)
          : currentApplications.map((currentApplication) =>
              currentApplication.id === application.id ? updatedApplication : currentApplication,
            ),
      )
      setFeedback({
        type: 'success',
        message:
          status === 'approved'
            ? `${application.applicant_username} ya puede crear cursos como mentor.`
            : `La solicitud de ${application.applicant_username} fue rechazada.`,
      })
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'No se pudo actualizar la solicitud.',
      })
    } finally {
      setActiveDecision(null)
    }
  }

  return (
    <section className="rounded-[2rem] border border-primary/20 bg-card/92 p-6 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
            <UserRoundCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium tracking-[0.24em] text-primary uppercase">Administración</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">Solicitudes de mentoría</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Revisa cada perfil y decide si puede publicar y gestionar cursos en Mentras.
            </p>
          </div>
        </div>
        <span className="w-fit rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
          Solo administradores
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2" aria-label="Filtrar solicitudes de mentoría">
        {([
          ['pending', 'Pendientes'],
          ['approved', 'Aprobadas'],
          ['rejected', 'Rechazadas'],
          ['all', 'Todas'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              filter === value
                ? 'bg-primary text-primary-foreground'
                : 'border border-border bg-background text-foreground hover:bg-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {feedback ? (
        <div
          className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-primary/25 bg-primary/8 text-foreground'
              : 'border-destructive/25 bg-destructive/10 text-foreground'
          }`}
          role={feedback.type === 'error' ? 'alert' : 'status'}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="mt-5 space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Cargando solicitudes...
          </div>
        ) : applications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-background/70 p-4 text-sm leading-6 text-muted-foreground">
            No hay solicitudes {filter === 'all' ? '' : STATUS_COPY[filter].toLowerCase()} para revisar.
          </div>
        ) : (
          applications.map((application) => {
            const isPending = application.status === 'pending'
            const isProcessing = activeDecision === application.id

            return (
              <article key={application.id} className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-foreground">{application.applicant_username}</p>
                      <span className="rounded-full border border-border/70 bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        {STATUS_COPY[application.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{application.applicant_email}</p>
                  </div>
                  <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock3 className="h-3.5 w-3.5" />
                    {formatDateTime(application.created_at)}
                  </div>
                </div>

                <dl className="mt-4 grid gap-3 text-sm">
                  <div>
                    <dt className="font-semibold text-foreground">Especialidad</dt>
                    <dd className="mt-1 leading-6 text-muted-foreground">{application.expertise}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-foreground">Experiencia</dt>
                    <dd className="mt-1 whitespace-pre-wrap leading-6 text-muted-foreground">{application.experience}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-foreground">Motivación</dt>
                    <dd className="mt-1 whitespace-pre-wrap leading-6 text-muted-foreground">{application.motivation}</dd>
                  </div>
                </dl>

                {isPending ? (
                  <div className="mt-5 flex flex-wrap gap-2 border-t border-border/70 pt-4">
                    <button
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                      disabled={isProcessing}
                      type="button"
                      onClick={() => void handleDecision(application, 'approved')}
                    >
                      {isProcessing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Aprobar mentor
                    </button>
                    <button
                      className="inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/8 px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-destructive/12 disabled:cursor-not-allowed disabled:opacity-70"
                      disabled={isProcessing}
                      type="button"
                      onClick={() => void handleDecision(application, 'rejected')}
                    >
                      <XCircle className="h-4 w-4" />
                      Rechazar
                    </button>
                  </div>
                ) : null}
              </article>
            )
          })
        )}
      </div>
    </section>
  )
}
