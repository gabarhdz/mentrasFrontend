import { useEffect, useState } from 'react'
import {
  BellDot,
  ChartNoAxesColumn,
  CircleCheckBig,
  Clock3,
  FileText,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
  WandSparkles,
} from 'lucide-react'

import {
  ProfileDetailCard,
  ProfileHeroCard,
  ProfileMetricCard,
  ProfileQuickActionCard,
} from '@/components/profile/profile-sections'
import { authFetch, clearAuthTokens, hasStoredSession } from '@/lib/auth'
import { buildBackendUrl } from '@/lib/utils'
import Footer from '@/components/ui/Footer'
import { Reveal } from '@/components/ui/reveal'
import { SectionHeading } from '@/components/ui/section-heading'

const metrics = [
  {
    icon: CircleCheckBig,
    label: 'Estado de cuenta',
    value: 'Activa',
    helper: 'Tu acceso esta listo para seguir completando y usando Mentras.',
    tone: 'primary' as const,
  },
  {
    icon: ChartNoAxesColumn,
    label: 'Nivel de perfil',
    value: 'Basico',
    helper: 'Ya tienes una base creada para empezar a ordenar tu operacion digital.',
    tone: 'secondary' as const,
  },
  {
    icon: Clock3,
    label: 'Ultima accion',
    value: 'Hoy',
    helper: 'El flujo de acceso y verificacion quedo registrado recientemente.',
    tone: 'accent' as const,
  },
]

const quickActions = [
  {
    icon: WandSparkles,
    title: 'Completar tu perfil',
    description: 'Agrega mas datos de contacto, negocio y preferencias para personalizar la experiencia.',
    href: '/profile',
  },
  {
    icon: BellDot,
    title: 'Configurar alertas',
    description: 'Define como quieres recibir avisos de actividad, recordatorios y proximos pasos.',
    href: '/profile',
  },
  {
    icon: FileText,
    title: 'Revisar documentos',
    description: 'Mantene a mano los datos clave de tu cuenta y proximas configuraciones sugeridas.',
    href: '/profile',
  },
]

const nextSteps = [
  'Subir una foto y datos visibles para tu negocio.',
  'Conectar tus canales principales de contacto.',
  'Definir un flujo simple para responder mas rapido.',
]

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
  const userId = localStorage.getItem('idUser')
  const shortUserId = (user?.id || userId) ? `${(user?.id || userId)?.slice(0, 8)}...` : 'Sin ID'
  const profileImage = resolveMediaUrl(user?.profile_pic)
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
    userRoles.length ? userRoles.join(' • ') : 'Base inicial lista',
    'Siguiente paso: completar perfil',
  ]

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

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 px-6 pb-20 pt-8 sm:pt-10">
        <div className="mx-auto max-w-6xl space-y-8">
          <Reveal>
            <ProfileHeroCard
              eyebrow="Tu espacio en Mentras"
              title="Un perfil claro para empezar a ordenar tu presencia digital."
              description="Esta vista resume lo esencial de tu cuenta y te deja a un paso de completar la informacion basica para trabajar con mas orden, confianza y seguimiento."
              chips={heroChips}
            >
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt={`Foto de perfil de ${displayName}`}
                      className="size-18 rounded-[1.5rem] object-cover shadow-lg shadow-primary/20 ring-1 ring-border"
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
                    <p className="mt-2 text-base font-semibold">{userRoles.length ? 'Revisar permisos y datos basicos' : 'Completar datos basicos'}</p>
                  </div>
                </div>
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
                title="Lo basico de tu perfil, presentado con claridad"
                description="Pensamos esta pantalla como un punto de partida: menos ruido, informacion util y acciones rapidas para seguir construyendo tu presencia en Mentras."
              />
            </Reveal>

            <div className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <Reveal delay={0.08}>
                <ProfileDetailCard
                  icon={UserRound}
                  title="Informacion principal"
                  description="Aqui vive la base de tu perfil. Por ahora mostramos una estructura inicial lista para conectar con datos reales."
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
                      <p className="mt-2 text-base font-semibold">{user?.email || 'Pendiente de sincronizar'}</p>
                    </div>
                    <div className="rounded-2xl bg-background p-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="size-4" />
                        <p className="text-sm font-medium">Telefono</p>
                      </div>
                      <p className="mt-2 text-base font-semibold">{user?.phone_number || 'Pendiente de sincronizar'}</p>
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
                  title="Siguientes pasos recomendados"
                  description="Pequenos avances que te acercan a una presencia mas completa y lista para operar."
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

          <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <Reveal delay={0.1}>
              <ProfileDetailCard
                icon={ShieldCheck}
                title="Estado y confianza"
                description="Una cuenta bien presentada transmite orden y facilita los siguientes pasos de configuracion."
                className="h-full"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/80 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_10%,white),white)] p-4 dark:bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_14%,black),black)]">
                    <p className="text-sm font-medium text-primary">Verificacion</p>
                    <p className="mt-2 text-lg font-semibold">Correo confirmado</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      El acceso a tu cuenta ya paso por el primer paso de seguridad.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/80 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--secondary)_16%,white),white)] p-4 dark:bg-[linear-gradient(135deg,color-mix(in_oklab,var(--secondary)_14%,black),black)]">
                    <p className="text-sm font-medium text-secondary-foreground">Preparacion</p>
                    <p className="mt-2 text-lg font-semibold">Perfil en progreso</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      La estructura ya existe; ahora faltan datos y conexiones para completarla.
                    </p>
                  </div>
                </div>
              </ProfileDetailCard>
            </Reveal>

            <Reveal delay={0.16}>
              <ProfileDetailCard
                icon={BellDot}
                title="Acciones rapidas"
                description="Atajos visuales para las tareas mas comunes de esta etapa inicial."
                className="h-full"
              >
                <div className="grid gap-4 md:grid-cols-3">
                  {quickActions.map((action) => (
                    <ProfileQuickActionCard key={action.title} {...action} />
                  ))}
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
