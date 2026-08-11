import { useEffect, useState } from 'react'
import { LoaderCircle, ShieldAlert, UserRoundMinus, UsersRound } from 'lucide-react'

import { authFetch, clearAuthTokens } from '@/lib/auth'
import { buildBackendUrl } from '@/lib/utils'

type PlatformRole = 'mentor' | 'pyme_owner'

type PlatformRoleUser = {
  id: string
  username: string
  email: string
  is_mentor: boolean
  is_pyme_owner: boolean
  is_admin: boolean
  is_superuser: boolean
}

type FeedbackState = {
  type: 'success' | 'error'
  message: string
}

const getResponseErrorMessage = async (response: Response, fallbackMessage: string) => {
  try {
    const data = await response.json()

    if (typeof data.error === 'string') return data.error
    if (typeof data.detail === 'string') return data.detail
    if (typeof data.message === 'string') return data.message
  } catch {
    // El mensaje de respaldo cubre respuestas no JSON.
  }

  return fallbackMessage
}

export function MentorsAdminPanel() {
  const [users, setUsers] = useState<PlatformRoleUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeRemovalKey, setActiveRemovalKey] = useState('')
  const [pendingRemovalKey, setPendingRemovalKey] = useState('')
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)

  const loadUsers = async () => {
    setIsLoading(true)
    setFeedback(null)

    try {
      const response = await authFetch(buildBackendUrl('/api/learning/mentor/users/'))

      if (response.status === 401) {
        clearAuthTokens()
        throw new Error('Tu sesion vencio. Inicia sesion de nuevo para gestionar mentores.')
      }

      if (!response.ok) {
        throw new Error(await getResponseErrorMessage(response, 'No se pudieron cargar los usuarios con rangos.'))
      }

      const payload = await response.json()
      setUsers(Array.isArray(payload) ? (payload as PlatformRoleUser[]) : [])
    } catch (error) {
      setUsers([])
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'No se pudieron cargar los usuarios con rangos.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadUsers()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [])

  const getRemovalKey = (userId: string, role: PlatformRole) => `${userId}:${role}`

  const getRoleLabel = (role: PlatformRole) => (role === 'mentor' ? 'mentor' : 'dueno de pyme')

  const handleRemoveRole = async (user: PlatformRoleUser, role: PlatformRole) => {
    const removalKey = getRemovalKey(user.id, role)
    setActiveRemovalKey(removalKey)
    setFeedback(null)

    try {
      const response = await authFetch(
        buildBackendUrl(`/api/learning/mentor/users/${user.id}/${role}/`),
        {
          method: 'DELETE',
        },
      )

      if (response.status === 401) {
        clearAuthTokens()
        throw new Error('Tu sesion vencio. Inicia sesion de nuevo para gestionar mentores.')
      }

      if (!response.ok) {
        throw new Error(await getResponseErrorMessage(response, 'No se pudo retirar el rango.'))
      }

      const updatedUser = (await response.json()) as PlatformRoleUser
      setUsers((currentUsers) =>
        currentUsers
          .map((currentUser) => (currentUser.id === user.id ? updatedUser : currentUser))
          .filter((currentUser) => currentUser.is_mentor || currentUser.is_pyme_owner),
      )
      setPendingRemovalKey('')
      setFeedback({
        type: 'success',
        message: `${user.username} ya no tiene rango de ${getRoleLabel(role)}.`,
      })
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'No se pudo retirar el rango.',
      })
    } finally {
      setActiveRemovalKey('')
    }
  }

  return (
    <section className="rounded-[2rem] border border-border/70 bg-card/92 p-6 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
            <UsersRound className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium tracking-[0.24em] text-primary uppercase">Rangos activos</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">Gestionar mentores y dueños de pyme</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Retira permisos operativos cuando un usuario ya no deba crear cursos o administrar pymes.
            </p>
          </div>
        </div>
        <button
          className="w-fit rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading}
          type="button"
          onClick={() => void loadUsers()}
        >
          Actualizar
        </button>
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

      <div className="mt-5 space-y-3">
        {isLoading ? (
          <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Cargando usuarios...
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-background/70 p-4 text-sm leading-6 text-muted-foreground">
            No hay usuarios con rangos activos.
          </div>
        ) : (
          users.map((user) => {
            const isProtected = user.is_admin || user.is_superuser
            const activeRoles: PlatformRole[] = [
              ...(user.is_mentor ? (['mentor'] as const) : []),
              ...(user.is_pyme_owner ? (['pyme_owner'] as const) : []),
            ]

            return (
              <article
                key={user.id}
                className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5"
              >
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-foreground">{user.username}</p>
                      {user.is_mentor ? (
                        <span className="rounded-full border border-primary/20 bg-primary/8 px-2.5 py-1 text-xs font-medium text-primary">
                          Mentor
                        </span>
                      ) : null}
                      {user.is_pyme_owner ? (
                        <span className="rounded-full border border-secondary/25 bg-secondary/10 px-2.5 py-1 text-xs font-medium text-foreground">
                          Dueño de pyme
                        </span>
                      ) : null}
                      {isProtected ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/8 px-2.5 py-1 text-xs font-medium text-primary">
                          <ShieldAlert className="h-3.5 w-3.5" />
                          Protegido
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
                  </div>

                  {isProtected ? (
                    <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                      Los administradores y superusers deben cambiar rangos desde la administracion de usuarios.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      {activeRoles.map((role) => {
                        const removalKey = getRemovalKey(user.id, role)
                        const isConfirming = pendingRemovalKey === removalKey
                        const isProcessing = activeRemovalKey === removalKey
                        const roleLabel = getRoleLabel(role)

                        return isConfirming ? (
                          <div key={role} className="flex flex-wrap gap-2">
                            <button
                              className="inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-destructive/15 disabled:cursor-not-allowed disabled:opacity-70"
                              disabled={isProcessing}
                              type="button"
                              onClick={() => void handleRemoveRole(user, role)}
                            >
                              {isProcessing ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                              ) : (
                                <UserRoundMinus className="h-4 w-4" />
                              )}
                              Confirmar {roleLabel}
                            </button>
                            <button
                              className="rounded-full border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
                              disabled={isProcessing}
                              type="button"
                              onClick={() => setPendingRemovalKey('')}
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            key={role}
                            className="inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/8 px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-destructive/12"
                            type="button"
                            onClick={() => {
                              setFeedback(null)
                              setPendingRemovalKey(removalKey)
                            }}
                          >
                            <UserRoundMinus className="h-4 w-4" />
                            Retirar {roleLabel}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </article>
            )
          })
        )}
      </div>
    </section>
  )
}
