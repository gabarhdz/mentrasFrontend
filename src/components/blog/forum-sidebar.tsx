import { BadgeCheck, Lock, MessageSquare, ShieldCheck } from 'lucide-react'

import { cn } from '@/lib/utils'

type ForumSidebarProps = {
  forums: {
    id: string
    name: string
    description: string
    profilePic: string
    isPrivate: boolean
  }[]
  activeForumId: string | null
  supportsScopedPosts: boolean
  selectedForumPostCount: number | null
  onSelectForum: (forumId: string) => void
}

const getInitials = (value: string) =>
  value
    .split(' ')
    .map((segment) => segment.trim()[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()

export function ForumSidebar({
  forums,
  activeForumId,
  supportsScopedPosts,
  selectedForumPostCount,
  onSelectForum,
}: ForumSidebarProps) {
  return (
    <aside className="space-y-5">
      <section className="rounded-[1.75rem] border border-border/70 bg-card/92 p-5 shadow-sm backdrop-blur">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">Foros</p>
        <h3 className="mt-3 text-xl font-semibold tracking-tight text-foreground">
          Directorio para ubicarte rapido
        </h3>

        <div className="mt-5 space-y-3">
          {forums.map((forum) => {
            const isActive = forum.id === activeForumId

            return (
              <button
                key={forum.id}
                type="button"
                className={cn(
                  'w-full rounded-[1.35rem] border p-4 text-left transition',
                  isActive
                    ? 'border-primary/30 bg-primary/8 shadow-sm'
                    : 'border-border/70 bg-background/75 hover:border-primary/20 hover:bg-primary/5',
                )}
                onClick={() => onSelectForum(forum.id)}
              >
                <div className="flex items-start gap-3">
                  {forum.profilePic ? (
                    <img
                      src={forum.profilePic}
                      alt={`Imagen de ${forum.name}`}
                      className="size-12 rounded-[1rem] object-cover"
                    />
                  ) : (
                    <div className="inline-flex size-12 items-center justify-center rounded-[1rem] bg-primary/12 text-sm font-semibold text-primary">
                      {getInitials(forum.name)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{forum.name}</p>
                      {forum.isPrivate ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] text-secondary-foreground">
                          <Lock className="size-3.5" />
                          Privado
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {forum.description}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-border/70 bg-card/92 p-5 shadow-sm backdrop-blur">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">Estado del foro</p>
        <h3 className="mt-3 text-xl font-semibold tracking-tight text-foreground">
          Contexto visible antes de publicar
        </h3>

        <div className="mt-5 space-y-3">
          <article className="rounded-[1.35rem] border border-border/70 bg-background/75 p-4">
            <div className="mb-3 inline-flex size-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <MessageSquare className="size-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">Foro seleccionado</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {forums.find((forum) => forum.id === activeForumId)?.name || 'Todavia no se selecciono un foro.'}
            </p>
          </article>

          <article className="rounded-[1.35rem] border border-border/70 bg-background/75 p-4">
            <div className="mb-3 inline-flex size-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <BadgeCheck className="size-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">Lectura actual</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {supportsScopedPosts && selectedForumPostCount !== null
                ? `${selectedForumPostCount} publicaciones asociadas al foro activo.`
                : 'El listado mantiene actividad reciente y el formulario publica en el foro seleccionado.'}
            </p>
          </article>

          <article className="rounded-[1.35rem] border border-border/70 bg-background/75 p-4">
            <div className="mb-3 inline-flex size-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <ShieldCheck className="size-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">Reglas practicas</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Usa un titulo claro, explica el contexto y comparte hasta cuatro imagenes cuando hagan falta.
            </p>
          </article>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-border/70 bg-linear-to-br from-card via-card to-primary/8 p-5 shadow-sm">
        <h3 className="text-xl font-semibold tracking-tight text-foreground">Galeria por publicacion</h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Las tarjetas contemplan todos los casos admitidos en esta seccion visual.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {['0 fotos', '1 foto', '2 fotos', '3 fotos', '4 fotos'].map((item) => (
            <span
              key={item}
              className="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs text-muted-foreground"
            >
              {item}
            </span>
          ))}
        </div>
      </section>
    </aside>
  )
}
