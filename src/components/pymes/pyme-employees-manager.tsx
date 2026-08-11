import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, CircleAlert, LoaderCircle, Plus, Trash2, Users, X } from 'lucide-react'

import { authFetch, clearAuthTokens, getStoredUserId, hasStoredSession } from '@/lib/auth'
import { buildBackendUrl } from '@/lib/utils'
import { resolveMediaUrl } from '@/components/pymes/pyme-menu-shared'

const roles = ['manager', 'employee', 'inventory'] as const
type EmployeeRole = (typeof roles)[number]

type Employee = {
  id: string
  user_id?: string
  username: string
  email: string
  role: EmployeeRole
  profile_pic?: string
  created_at?: string
}

type Props = {
  pymeId: string
  pymeName: string
}

type UserSearchResult = {
  id: string
  username: string
  email: string
  profile_pic?: string
}

const isRole = (value: unknown): value is EmployeeRole =>
  typeof value === 'string' && roles.includes(value as EmployeeRole)

const asEmployee = (value: unknown): Employee | null => {
  if (!value || typeof value !== 'object') return null
  const entry = value as Record<string, unknown>
  if (typeof entry.id !== 'string') return null
  return {
    id: entry.id,
    user_id: typeof entry.user_id === 'string' ? entry.user_id : undefined,
    username: typeof entry.username === 'string' ? entry.username : 'Usuario sin nombre',
    email: typeof entry.email === 'string' ? entry.email : 'Sin email',
    role: isRole(entry.role) ? entry.role : 'employee',
    profile_pic: typeof entry.profile_pic === 'string' ? entry.profile_pic : undefined,
    created_at: typeof entry.created_at === 'string' ? entry.created_at : undefined,
  }
}

const asUserSearchResult = (value: unknown): UserSearchResult | null => {
  if (!value || typeof value !== 'object') return null
  const entry = value as Record<string, unknown>
  if (typeof entry.id !== 'string' || typeof entry.username !== 'string') return null
  return {
    id: entry.id,
    username: entry.username,
    email: typeof entry.email === 'string' ? entry.email : '',
    profile_pic: typeof entry.profile_pic === 'string' ? entry.profile_pic : undefined,
  }
}

const responseMessage = async (response: Response, fallback: string) => {
  try {
    const payload = await response.json()
    if (typeof payload?.detail === 'string') return payload.detail
    if (typeof payload?.error === 'string') return payload.error
    if (typeof payload?.message === 'string') return payload.message
    if (payload && typeof payload === 'object') {
      const first = Object.values(payload)[0]
      if (Array.isArray(first) && typeof first[0] === 'string') return first[0]
      if (typeof first === 'string') return first
    }
  } catch {
    // Some successful/error responses have no JSON body.
  }
  return fallback
}

const roleLabel: Record<EmployeeRole, string> = {
  manager: 'Administrador',
  employee: 'Empleado',
  inventory: 'Inventario',
}

export default function PymeEmployeesManager({ pymeId, pymeName }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isOwner, setIsOwner] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeOperation, setActiveOperation] = useState<string | null>(null)
  const [userSearch, setUserSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null)
  const [userDirectory, setUserDirectory] = useState<UserSearchResult[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [role, setRole] = useState<EmployeeRole>('employee')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleSessionError = useCallback((status: number) => {
    if (status === 401) {
      clearAuthTokens()
      setFeedback({ type: 'error', message: 'Tu sesión venció. Inicia sesión de nuevo para continuar.' })
      return true
    }
    return false
  }, [])

  const loadEmployees = useCallback(async () => {
    if (!hasStoredSession()) {
      setFeedback({ type: 'error', message: 'Inicia sesión para gestionar empleados.' })
      return
    }
    setIsLoading(true)
    setFeedback(null)
    try {
      const detailResponse = await authFetch(buildBackendUrl(`/api/pyme/${pymeId}/`))
      if (!detailResponse.ok) {
        if (handleSessionError(detailResponse.status)) return
        if (detailResponse.status === 403) {
          setIsOwner(false)
          setFeedback({ type: 'error', message: 'Solo el propietario puede gestionar esta pyme.' })
          return
        }
        throw new Error(await responseMessage(detailResponse, 'No se pudo validar la propiedad de la pyme.'))
      }

      const detail = await detailResponse.json() as { owner?: unknown }
      const currentUserId = getStoredUserId()
      if (!currentUserId || String(detail.owner) !== String(currentUserId)) {
        setIsOwner(false)
        setFeedback({ type: 'error', message: 'Solo el propietario puede gestionar esta pyme.' })
        return
      }
      setIsOwner(true)

      const response = await authFetch(buildBackendUrl(`/api/pyme/${pymeId}/employees/`))
      if (!response.ok) {
        if (handleSessionError(response.status)) return
        if (response.status === 403) throw new Error('No tienes permisos para ver los empleados de esta pyme.')
        throw new Error(await responseMessage(response, 'No se pudieron cargar los empleados.'))
      }
      const payload = await response.json()
      const normalizedEmployees = Array.isArray(payload)
        ? payload.map(asEmployee).filter((entry): entry is Employee => entry !== null)
        : []
      setEmployees(normalizedEmployees.map((employee) => {
        const directoryUser = userDirectory.find(
          (entry) => entry.username === employee.username || (employee.email !== 'Sin email' && entry.email === employee.email),
        )
        return directoryUser?.profile_pic && !employee.profile_pic
          ? { ...employee, profile_pic: directoryUser.profile_pic }
          : employee
      }))
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'No se pudieron cargar los empleados.' })
    } finally {
      setIsLoading(false)
    }
  }, [handleSessionError, pymeId, userDirectory])

  const loadUserDirectory = useCallback(async () => {
    setIsLoadingUsers(true)
    try {
      const response = await authFetch(buildBackendUrl('/api/user/'))
      if (!response.ok) {
        if (handleSessionError(response.status)) return
        throw new Error(await responseMessage(response, 'No se pudieron buscar usuarios.'))
      }
      const payload = await response.json()
      setUserDirectory(Array.isArray(payload) ? payload.map(asUserSearchResult).filter((entry): entry is UserSearchResult => entry !== null) : [])
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'No se pudieron buscar usuarios.' })
    } finally {
      setIsLoadingUsers(false)
    }
  }, [handleSessionError])

  useEffect(() => {
    if (!isOpen) return
    const timer = window.setTimeout(() => void loadEmployees(), 0)
    return () => window.clearTimeout(timer)
  }, [isOpen, loadEmployees])

  useEffect(() => {
    if (!isOpen || userDirectory.length > 0) return
    const timer = window.setTimeout(() => void loadUserDirectory(), 0)
    return () => window.clearTimeout(timer)
  }, [isOpen, loadUserDirectory, userDirectory.length])

  const matchingUsers = userSearch.trim().length < 2
    ? []
    : userDirectory
        .filter((entry) => `${entry.username} ${entry.email} ${entry.id}`.toLowerCase().includes(userSearch.trim().toLowerCase()))
        .filter((entry) => entry.id !== getStoredUserId())
        .slice(0, 6)

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedUserId = selectedUser?.id ?? userSearch.trim()
    if (!normalizedUserId) {
      setFeedback({ type: 'error', message: 'Busca un nickname o introduce un UUID válido.' })
      return
    }
    setActiveOperation('add')
    setFeedback(null)
    try {
      const response = await authFetch(buildBackendUrl(`/api/pyme/${pymeId}/employees/`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: normalizedUserId, role }),
      })
      if (!response.ok) {
        if (handleSessionError(response.status)) return
        throw new Error(await responseMessage(response, response.status === 400 ? 'El usuario ya pertenece a esta pyme o los datos no son válidos.' : 'No se pudo añadir el empleado.'))
      }
      const added = asEmployee(await response.json())
      if (added) setEmployees((current) => [...current, added])
      setUserSearch('')
      setSelectedUser(null)
      setRole('employee')
      setFeedback({ type: 'success', message: 'Empleado añadido correctamente.' })
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'No se pudo añadir el empleado.' })
    } finally {
      setActiveOperation(null)
    }
  }

  const handleRoleChange = async (employee: Employee, nextRole: EmployeeRole) => {
    if (nextRole === employee.role) return
    setActiveOperation(`role:${employee.id}`)
    setFeedback(null)
    try {
      const response = await authFetch(buildBackendUrl(`/api/pyme/${pymeId}/employees/${employee.id}/`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole }),
      })
      if (!response.ok) {
        if (handleSessionError(response.status)) return
        throw new Error(await responseMessage(response, 'No se pudo actualizar el rol.'))
      }
      const updated = asEmployee(await response.json())
      setEmployees((current) => current.map((entry) => updated && entry.id === updated.id ? updated : entry))
      setFeedback({ type: 'success', message: 'Rol actualizado.' })
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'No se pudo actualizar el rol.' })
    } finally {
      setActiveOperation(null)
    }
  }

  const handleDelete = async (employee: Employee) => {
    if (!window.confirm(`¿Eliminar a ${employee.username} de ${pymeName}?`)) return
    setActiveOperation(`delete:${employee.id}`)
    setFeedback(null)
    try {
      const response = await authFetch(buildBackendUrl(`/api/pyme/${pymeId}/employees/${employee.id}/`), { method: 'DELETE' })
      if (!response.ok) {
        if (handleSessionError(response.status)) return
        throw new Error(await responseMessage(response, response.status === 403 ? 'No tienes permisos para eliminar este empleado.' : 'No se pudo eliminar el empleado.'))
      }
      setEmployees((current) => current.filter((entry) => entry.id !== employee.id))
      setFeedback({ type: 'success', message: 'Empleado eliminado.' })
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'No se pudo eliminar el empleado.' })
    } finally {
      setActiveOperation(null)
    }
  }

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
        <Users className="size-4" /> Gestionar empleados
      </button>

      {isOpen ? createPortal(
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-labelledby={`employees-${pymeId}`}>
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-border bg-background p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Equipo de la pyme</p>
                <h2 id={`employees-${pymeId}`} className="mt-2 text-2xl font-semibold tracking-tight">{pymeName}</h2>
                <p className="mt-1 text-sm text-muted-foreground">Añade personas, asigna responsabilidades y mantén el equipo actualizado.</p>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Cerrar"><X className="size-5" /></button>
            </div>

            {feedback ? <div className={`mt-5 flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm ${feedback.type === 'error' ? 'border-destructive/25 bg-destructive/10' : 'border-primary/25 bg-primary/10'}`}><span>{feedback.type === 'error' ? <CircleAlert className="mt-0.5 size-4" /> : <Check className="mt-0.5 size-4" />}</span><span>{feedback.message}</span></div> : null}

            {!isOwner && !isLoading ? null : (
              <>
                <form onSubmit={handleAdd} className="mt-6 grid gap-3 rounded-2xl border border-border/80 bg-card/60 p-4 md:grid-cols-[1fr_180px_auto] md:items-end">
                  <div className="relative">
                    <label className="text-sm font-medium" htmlFor={`employee-search-${pymeId}`}>Buscar usuario</label>
                    <input id={`employee-search-${pymeId}`} value={userSearch} onChange={(event) => { setUserSearch(event.target.value); setSelectedUser(null) }} placeholder="Nickname o UUID" className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" autoComplete="off" />
                    {isLoadingUsers ? <span className="absolute right-3 top-9"><LoaderCircle className="size-4 animate-spin text-muted-foreground" /></span> : null}
                    {matchingUsers.length > 0 ? <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-64 overflow-y-auto rounded-2xl border border-border bg-background p-1 shadow-xl">{matchingUsers.map((candidate) => <button type="button" key={candidate.id} onClick={() => { setSelectedUser(candidate); setUserSearch(candidate.username) }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-muted"><span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-semibold text-primary">{candidate.profile_pic ? <img src={resolveMediaUrl(candidate.profile_pic) ?? undefined} alt="" className="size-full object-cover" /> : candidate.username.slice(0, 1).toUpperCase()}</span><span className="min-w-0"><span className="block truncate text-sm font-semibold">{candidate.username}</span><span className="block truncate text-xs text-muted-foreground">{candidate.email || candidate.id}</span></span></button>)}</div> : null}
                    {selectedUser ? <p className="mt-1 text-xs text-primary">Seleccionado: {selectedUser.username}</p> : null}
                  </div>
                  <label className="text-sm font-medium">Rol<select value={role} onChange={(event) => setRole(event.target.value as EmployeeRole)} className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary">{roles.map((entry) => <option key={entry} value={entry}>{roleLabel[entry]}</option>)}</select></label>
                  <button type="submit" disabled={activeOperation !== null} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60">{activeOperation === 'add' ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />} Añadir</button>
                </form>

                <div className="mt-6 space-y-3">
                  {isLoading ? <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground"><LoaderCircle className="size-5 animate-spin" /> Cargando empleados…</div> : employees.length === 0 ? <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Todavía no hay empleados en esta pyme.</p> : employees.map((employee) => <div key={employee.id} className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 md:flex-row md:items-center md:justify-between"><div className="flex min-w-0 items-center gap-3"><span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-semibold text-primary">{employee.profile_pic ? <img src={resolveMediaUrl(employee.profile_pic) ?? undefined} alt={employee.username} className="size-full object-cover" /> : employee.username.slice(0, 1).toUpperCase()}</span><div className="min-w-0"><p className="truncate font-semibold">{employee.username}</p><p className="truncate text-sm text-muted-foreground">{employee.email}</p></div></div><div className="flex items-center gap-2"><select value={employee.role} disabled={activeOperation !== null} onChange={(event) => void handleRoleChange(employee, event.target.value as EmployeeRole)} className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary">{roles.map((entry) => <option key={entry} value={entry}>{roleLabel[entry]}</option>)}</select><button type="button" disabled={activeOperation !== null} onClick={() => void handleDelete(employee)} className="inline-flex items-center gap-1 rounded-xl border border-destructive/25 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60">{activeOperation === `delete:${employee.id}` ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Eliminar</button></div></div>)}
                </div>
              </>
            )}
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  )
}
