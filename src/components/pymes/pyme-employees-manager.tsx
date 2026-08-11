import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Check, CircleAlert, LoaderCircle, Plus, Trash2, Users, X } from 'lucide-react'

import { authFetch, clearAuthTokens, getStoredUserId, hasStoredSession } from '@/lib/auth'
import { buildBackendUrl } from '@/lib/utils'

const roles = ['manager', 'employee', 'inventory'] as const
type EmployeeRole = (typeof roles)[number]

type Employee = {
  id: string
  user_id?: string
  username: string
  email: string
  role: EmployeeRole
  created_at?: string
}

type Props = {
  pymeId: string
  pymeName: string
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
    created_at: typeof entry.created_at === 'string' ? entry.created_at : undefined,
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
  const [userId, setUserId] = useState('')
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
      setEmployees(Array.isArray(payload) ? payload.map(asEmployee).filter((entry): entry is Employee => entry !== null) : [])
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'No se pudieron cargar los empleados.' })
    } finally {
      setIsLoading(false)
    }
  }, [handleSessionError, pymeId])

  useEffect(() => {
    if (!isOpen) return
    const timer = window.setTimeout(() => void loadEmployees(), 0)
    return () => window.clearTimeout(timer)
  }, [isOpen, loadEmployees])

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedUserId = userId.trim()
    if (!normalizedUserId) {
      setFeedback({ type: 'error', message: 'Introduce el UUID del usuario que quieres añadir.' })
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
      setUserId('')
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

      {isOpen ? (
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
                  <label className="text-sm font-medium">UUID del usuario<input value={userId} onChange={(event) => setUserId(event.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" /></label>
                  <label className="text-sm font-medium">Rol<select value={role} onChange={(event) => setRole(event.target.value as EmployeeRole)} className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary">{roles.map((entry) => <option key={entry} value={entry}>{roleLabel[entry]}</option>)}</select></label>
                  <button type="submit" disabled={activeOperation !== null} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60">{activeOperation === 'add' ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />} Añadir</button>
                </form>

                <div className="mt-6 space-y-3">
                  {isLoading ? <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground"><LoaderCircle className="size-5 animate-spin" /> Cargando empleados…</div> : employees.length === 0 ? <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Todavía no hay empleados en esta pyme.</p> : employees.map((employee) => <div key={employee.id} className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 md:flex-row md:items-center md:justify-between"><div className="min-w-0"><p className="truncate font-semibold">{employee.username}</p><p className="truncate text-sm text-muted-foreground">{employee.email}</p></div><div className="flex items-center gap-2"><select value={employee.role} disabled={activeOperation !== null} onChange={(event) => void handleRoleChange(employee, event.target.value as EmployeeRole)} className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary">{roles.map((entry) => <option key={entry} value={entry}>{roleLabel[entry]}</option>)}</select><button type="button" disabled={activeOperation !== null} onClick={() => void handleDelete(employee)} className="inline-flex items-center gap-1 rounded-xl border border-destructive/25 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60">{activeOperation === `delete:${employee.id}` ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Eliminar</button></div></div>)}
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  )
}
