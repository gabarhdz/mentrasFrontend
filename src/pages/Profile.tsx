import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import {
  Camera,
  ChartNoAxesColumn,
  CircleCheckBig,
  Clock3,
  LogOut,
  Mail,
  PencilLine,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react'

import {
  ProfileDetailCard,
  ProfileHeroCard,
  ProfileMetricCard,
} from '@/components/profile/profile-sections'
import { authFetch, clearAuthTokens, getStoredUserId, hasStoredSession } from '@/lib/auth'
import { buildBackendUrl } from '@/lib/utils'
import Footer from '@/components/ui/Footer'
import { Reveal } from '@/components/ui/reveal'
import { SectionHeading } from '@/components/ui/section-heading'

const metrics = [
  {
    icon: CircleCheckBig,
    label: 'Estado de cuenta',
    value: 'Activa',
    helper: 'Tu cuenta esta activa y lista para usarse.',
    tone: 'primary' as const,
  },
  {
    icon: ChartNoAxesColumn,
    label: 'Nivel de perfil',
    value: 'Basico',
    helper: 'Ya completaste lo necesario para empezar.',
    tone: 'secondary' as const,
  },
  {
    icon: Clock3,
    label: 'Ultima accion',
    value: 'Hoy',
    helper: 'Hoy hubo actividad reciente en tu cuenta.',
    tone: 'accent' as const,
  },
]

const nextSteps = [
  'Revisar que tu correo y telefono esten correctos.',
  'Completar la informacion de tu negocio si hace falta.',
  'Agregar mas datos de contacto o configuracion cuando lo necesites.',
]

const inputClassName =
  'mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'

type UserProfile = {
  id?: string
  username?: string
  email?: string
  phone_number?: string
  profile_pic?: string
  is_mod?: boolean
  is_admin?: boolean
  is_mentor?: boolean
  is_pyme_owner?: boolean
}

type ProfileFormState = {
  username: string
  email: string
  phoneNumber: string
  isPymeOwner: boolean
}

type FeedbackState = {
  type: 'success' | 'error'
  message: string
}

const resolveMediaUrl = (value?: string | null) => {
  if (!value) {
    return null
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value
  }

  return buildBackendUrl(value)
}

export default function Profile() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    username: '',
    email: '',
    phoneNumber: '',
    isPymeOwner: false,
  })
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null)
  const [profilePreviewUrl, setProfilePreviewUrl] = useState<string | null>(null)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileFeedback, setProfileFeedback] = useState<FeedbackState | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const userId = getStoredUserId()
  const shortUserId = (user?.id || userId) ? `${(user?.id || userId)?.slice(0, 8)}...` : 'Sin ID'
  const profileImage = resolveMediaUrl(user?.profile_pic)
  const profileFormPreview = profilePreviewUrl || profileImage
  const displayName = user?.username || 'Tu cuenta Mentras'
  const initials = displayName.slice(0, 2).toUpperCase()
  const userRoles = [
    user?.is_admin ? 'Administrador' : null,
    user?.is_mod ? 'Moderador' : null,
    user?.is_mentor ? 'Mentor' : null,
    user?.is_pyme_owner ? 'Dueno de pyme' : null,
  ].filter(Boolean) as string[]
  const roleLabel = userRoles[0] || 'Usuario'
  const heroChips = [
    'Cuenta verificada',
    userRoles.length ? userRoles.join(' • ') : 'Sin roles especiales',
    'Perfil disponible',
  ]

  useEffect(() => {
    if (!profilePicFile) {
      setProfilePreviewUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(profilePicFile)
    setProfilePreviewUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [profilePicFile])

  useEffect(() => {
    if (!user) {
      return
    }

    setProfileForm({
      username: user.username || '',
      email: user.email || '',
      phoneNumber: user.phone_number || '',
      isPymeOwner: Boolean(user.is_pyme_owner),
    })
    setProfilePicFile(null)
    setProfileFeedback(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [user])

  useEffect(() => {
    if (!hasStoredSession()) {
      window.location.href = '/auth'
      return
    }

    if (!userId) {
      return
    }

    const loadUser = async () => {
      try {
        const response = await authFetch(buildBackendUrl(`/api/user/${userId}/`))

        if (!response.ok) {
          if (response.status === 401) {
            clearAuthTokens()
            window.location.href = '/auth'
            return
          }

          throw new Error(`No se pudo obtener el perfil. Codigo ${response.status}.`)
        }

        const data = await response.json()
        setUser(data)
      } catch (error) {
        console.error('Error loading profile:', error)
      }
    }

    loadUser()
  }, [userId])

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

  const handleLogout = () => {
    setIsLoggingOut(true)
    clearAuthTokens()
    window.location.href = '/auth'
  }

  const handleProfileFieldChange = (
    field: keyof ProfileFormState,
    value: string | boolean,
  ) => {
    setProfileForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
  }

  const handleProfilePicChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    const maxFileSize = 5 * 1024 * 1024

    if (file && file.size > maxFileSize) {
      setProfileFeedback({
        type: 'error',
        message: 'La imagen es demasiado grande. Elige una menor de 5MB.',
      })
      event.target.value = ''
      setProfilePicFile(null)
      return
    }

    setProfileFeedback(null)
    setProfilePicFile(file)
  }

  const clearSelectedProfilePic = () => {
    setProfilePicFile(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!userId) {
      setProfileFeedback({
        type: 'error',
        message: 'No encontramos tu usuario para actualizar el perfil.',
      })
      return
    }

    const username = profileForm.username.trim()
    const email = profileForm.email.trim()
    const phoneNumber = profileForm.phoneNumber.trim()

    if (!username || !email || !phoneNumber) {
      setProfileFeedback({
        type: 'error',
        message: 'Completa username, correo y telefono antes de guardar.',
      })
      return
    }

    if (!/^\d+$/.test(phoneNumber)) {
      setProfileFeedback({
        type: 'error',
        message: 'El telefono debe contener solo numeros.',
      })
      return
    }

    const formData = new FormData()
    formData.append('username', username)
    formData.append('email', email)
    formData.append('phone_number', phoneNumber)
    formData.append('is_pyme_owner', profileForm.isPymeOwner ? 'true' : 'false')

    if (profilePicFile) {
      formData.append('profile_pic', profilePicFile)
    }

    setIsSavingProfile(true)
    setProfileFeedback(null)

    try {
      const response = await authFetch(buildBackendUrl(`/api/user/${userId}/`), {
        method: 'PATCH',
        body: formData,
      })

      if (!response.ok) {
        if (response.status === 401) {
          clearAuthTokens()
          window.location.href = '/auth'
          return
        }

        throw new Error(
          await getResponseErrorMessage(response, 'No se pudo actualizar el perfil.'),
        )
      }

      const updatedUser = (await response.json()) as UserProfile
      setUser(updatedUser)
      setProfileFeedback({
        type: 'success',
        message: 'Perfil actualizado correctamente.',
      })
    } catch (error) {
      setProfileFeedback({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'Ocurrio un error al actualizar el perfil.',
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 px-6 pb-20 pt-8 sm:pt-10">
        <div className="mx-auto max-w-6xl space-y-8">
          <Reveal>
            <ProfileHeroCard
              eyebrow="Mi perfil"
              title="Informacion general de tu cuenta"
              description="Aqui puedes ver los datos principales de tu perfil y el estado actual de tu cuenta."
              chips={heroChips}
            >
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt={`Foto de perfil de ${displayName}`}
                      className="size-32 rounded-[1.5rem] object-cover shadow-lg shadow-primary/20 ring-1 ring-border"
                    />
                  ) : (
                    <div className="flex size-18 items-center justify-center rounded-[1.5rem] bg-primary text-2xl font-semibold text-primary-foreground shadow-lg shadow-primary/20">
                      {initials}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">
                      Perfil
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">{displayName}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Identificador: {shortUserId}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-background p-4">
                    <p className="text-sm font-medium text-muted-foreground">Acceso</p>
                    <p className="mt-2 text-base font-semibold">Sesion habilitada</p>
                  </div>
                  <div className="rounded-2xl bg-background p-4">
                    <p className="text-sm font-medium text-muted-foreground">Prioridad sugerida</p>
                    <p className="mt-2 text-base font-semibold">{userRoles.length ? 'Revisar datos y permisos' : 'Completar datos basicos'}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-destructive/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LogOut className="size-4" />
                  {isLoggingOut ? 'Cerrando sesion...' : 'Cerrar sesion'}
                </button>
              </div>
            </ProfileHeroCard>
          </Reveal>

          <section className="grid gap-4 md:grid-cols-3">
            {metrics.map((metric, index) => (
              <Reveal key={metric.label} delay={0.06 * (index + 1)}>
                <ProfileMetricCard {...metric} />
              </Reveal>
            ))}
          </section>

          <section className="pt-4">
            <Reveal>
              <SectionHeading
                badge="Resumen"
                title="Resumen de tu perfil"
                description="Estos son los datos principales de tu cuenta."
              />
            </Reveal>

            <div className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <Reveal delay={0.08}>
                <ProfileDetailCard
                  icon={UserRound}
                  title="Informacion principal"
                  description="Datos basicos de tu cuenta."
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-background p-4">
                      <p className="text-sm font-medium text-muted-foreground">Nombre visible</p>
                      <p className="mt-2 text-base font-semibold">{displayName}</p>
                    </div>
                    <div className="rounded-2xl bg-background p-4">
                      <p className="text-sm font-medium text-muted-foreground">Rol</p>
                      <p className="mt-2 text-base font-semibold">{roleLabel}</p>
                    </div>
                    <div className="rounded-2xl bg-background p-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="size-4" />
                        <p className="text-sm font-medium">Correo</p>
                      </div>
                      <p className="mt-2 text-base font-semibold">{user?.email || 'No registrado'}</p>
                    </div>
                    <div className="rounded-2xl bg-background p-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="size-4" />
                        <p className="text-sm font-medium">Telefono</p>
                      </div>
                      <p className="mt-2 text-base font-semibold">{user?.phone_number || 'No registrado'}</p>
                    </div>
                    <div className="rounded-2xl bg-background p-4 sm:col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Permisos activos</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {userRoles.length ? (
                          userRoles.map((role) => (
                            <span
                              key={role}
                              className="rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                            >
                              {role}
                            </span>
                          ))
                        ) : (
                          <span className="text-base font-semibold">Sin roles especiales</span>
                        )}
                      </div>
                    </div>
                  </div>
                </ProfileDetailCard>
              </Reveal>

              <Reveal delay={0.14}>
                <ProfileDetailCard
                  icon={Sparkles}
                  title="Siguientes pasos"
                  description="Algunas acciones utiles para completar tu perfil."
                >
                  <div className="space-y-3">
                    {nextSteps.map((step, index) => (
                      <div
                        key={step}
                        className="flex items-start gap-3 rounded-2xl bg-background p-4"
                      >
                        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                          {index + 1}
                        </span>
                        <p className="text-sm leading-6 text-foreground">{step}</p>
                      </div>
                    ))}
                  </div>
                </ProfileDetailCard>
              </Reveal>
            </div>
          </section>

          <section className="pt-4">
            <Reveal>
              <SectionHeading
                badge="Edicion"
                title="Actualiza tu perfil"
                description="Cambia tus datos visibles y sube una nueva foto cuando lo necesites."
              />
            </Reveal>

            <Reveal delay={0.08}>
              <div className="mt-8">
                <ProfileDetailCard
                  icon={PencilLine}
                  title="Actualizar perfil"
                  description="Los cambios se guardan directamente en tu cuenta autenticada."
                >
                  <form className="space-y-6" onSubmit={handleProfileSubmit}>
                    {profileFeedback ? (
                      <div
                        className={`rounded-2xl border px-4 py-3 text-sm ${
                          profileFeedback.type === 'success'
                            ? 'border-primary/30 bg-primary/10 text-foreground'
                            : 'border-destructive/30 bg-destructive/10 text-foreground'
                        }`}
                      >
                        {profileFeedback.message}
                      </div>
                    ) : null}

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label
                          className="block text-sm font-medium text-muted-foreground"
                          htmlFor="profile-username"
                        >
                          Username
                        </label>
                        <input
                          id="profile-username"
                          type="text"
                          className={inputClassName}
                          value={profileForm.username}
                          onChange={(event) =>
                            handleProfileFieldChange('username', event.target.value)
                          }
                        />
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium text-muted-foreground"
                          htmlFor="profile-email"
                        >
                          Correo
                        </label>
                        <input
                          id="profile-email"
                          type="email"
                          className={inputClassName}
                          value={profileForm.email}
                          onChange={(event) =>
                            handleProfileFieldChange('email', event.target.value)
                          }
                        />
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium text-muted-foreground"
                          htmlFor="profile-phone"
                        >
                          Telefono
                        </label>
                        <input
                          id="profile-phone"
                          type="tel"
                          className={inputClassName}
                          value={profileForm.phoneNumber}
                          onChange={(event) =>
                            handleProfileFieldChange('phoneNumber', event.target.value)
                          }
                        />
                      </div>

                      <label className="flex items-center gap-3 rounded-2xl border border-input bg-background px-4 py-3 transition-colors hover:border-primary/40">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-primary/20"
                          checked={profileForm.isPymeOwner}
                          onChange={(event) =>
                            handleProfileFieldChange('isPymeOwner', event.target.checked)
                          }
                        />
                        <span>
                          <span className="block text-sm font-medium text-foreground">
                            Soy dueno de una pyme
                          </span>
                          <span className="block text-sm text-muted-foreground">
                            Esto actualiza el tipo de perfil asociado a tu cuenta.
                          </span>
                        </span>
                      </label>
                    </div>

                    <div className="rounded-[1.5rem] border border-dashed border-primary/35 bg-background/80 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Foto de perfil
                          </p>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            Sube una imagen nueva para reemplazar la actual. Formatos JPG, PNG o
                            WEBP de hasta 5MB.
                          </p>
                        </div>
                        <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
                          <Camera className="size-5" />
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                        <div className="rounded-2xl border border-border bg-card p-4">
                          {profileFormPreview ? (
                            <img
                              src={profileFormPreview}
                              alt={`Vista previa de ${displayName}`}
                              className="h-48 w-full rounded-xl object-cover ring-1 ring-border"
                            />
                          ) : (
                            <div className="flex h-48 w-full items-center justify-center rounded-xl bg-muted text-sm font-medium text-muted-foreground">
                              Todavia no tienes foto de perfil.
                            </div>
                          )}
                        </div>

                        <div className="space-y-4">
                          <input
                            ref={fileInputRef}
                            id="profile-pic-update"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleProfilePicChange}
                          />

                          <label
                            htmlFor="profile-pic-update"
                            className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-input bg-card px-4 py-5 text-center transition-colors hover:border-primary/50 hover:bg-muted/40"
                          >
                            <span className="text-sm font-semibold text-foreground">
                              {profilePicFile ? 'Cambiar imagen seleccionada' : 'Seleccionar nueva imagen'}
                            </span>
                            <span className="mt-2 text-sm text-muted-foreground">
                              Toca aqui para elegir una nueva foto desde tu dispositivo
                            </span>
                          </label>

                          {profilePicFile ? (
                            <div className="rounded-2xl border border-border bg-card p-4">
                              <p className="truncate text-sm font-semibold text-foreground">
                                {profilePicFile.name}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {(profilePicFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                              <button
                                type="button"
                                onClick={clearSelectedProfilePic}
                                className="mt-3 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                              >
                                Quitar imagen nueva
                              </button>
                            </div>
                          ) : (
                            <div className="rounded-2xl border border-border/70 bg-card/70 p-4 text-sm text-muted-foreground">
                              Si no eliges una imagen nueva, se conserva la foto actual.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-muted-foreground">
                        Tus cambios se reflejan al instante despues de guardar.
                      </p>
                      <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSavingProfile ? 'Guardando cambios...' : 'Guardar cambios'}
                      </button>
                    </div>
                  </form>
                </ProfileDetailCard>
              </div>
            </Reveal>
          </section>

          <section>
            <Reveal delay={0.1}>
              <ProfileDetailCard
                icon={ShieldCheck}
                title="Estado de la cuenta"
                description="Resumen general del estado actual de tu cuenta."
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/80 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_10%,white),white)] p-4 dark:bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_14%,black),black)]">
                    <p className="text-sm font-medium text-primary">Verificacion</p>
                    <p className="mt-2 text-lg font-semibold">Correo confirmado</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Tu correo ya fue validado correctamente.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/80 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--secondary)_16%,white),white)] p-4 dark:bg-[linear-gradient(135deg,color-mix(in_oklab,var(--secondary)_14%,black),black)]">
                    <p className="text-sm font-medium text-secondary-foreground">Perfil</p>
                    <p className="mt-2 text-lg font-semibold">Perfil en progreso</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Aun puedes completar o actualizar algunos datos.
                    </p>
                  </div>
                </div>
              </ProfileDetailCard>
            </Reveal>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
