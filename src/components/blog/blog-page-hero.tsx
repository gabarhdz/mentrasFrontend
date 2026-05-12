import { BookOpenText, ImagePlus, MessageSquareMore } from 'lucide-react'

import type { ForumRecord } from '@/components/blog/blog-types'
import { SectionHeading } from '@/components/ui/section-heading'

type BlogPageHeroProps = {
  activeForum: ForumRecord | null
  forumCount: number
  postCount: number
  visualPostCount: number
}

export function BlogPageHero({
  activeForum,
  forumCount,
  postCount,
  visualPostCount,
}: BlogPageHeroProps) {
  const stats = [
    {
      label: 'Foros visibles',
      value: String(forumCount),
      detail: 'Espacios disponibles para leer, participar y abrir nuevas conversaciones.',
    },
    {
      label: 'Posts cargados',
      value: String(postCount),
      detail: 'Publicaciones recientes integradas en la experiencia del blog comunitario.',
    },
    {
      label: 'Posts con fotos',
      value: String(visualPostCount),
      detail: 'La galeria admite cero, una o hasta cuatro imagenes por publicacion.',
    },
  ]

  return (
    <section className="rounded-[2rem] border border-border/70 bg-linear-to-br from-background via-card to-primary/8 p-6 shadow-sm sm:p-8">
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
        <SectionHeading
          badge={activeForum ? `Foro actual: ${activeForum.name}` : 'Foros'}
          title={activeForum ? activeForum.name : 'Explora las conversaciones de la comunidad'}
          description={
            activeForum
              ? activeForum.description
              : 'Selecciona un foro para dejar claro el contexto de lectura y publicacion. Cada post mantiene autoria visible y una galeria flexible de hasta cuatro fotos.'
          }
        />

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-4">
            <div className="mb-3 inline-flex size-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <MessageSquareMore className="size-5" />
            </div>
            <p className="text-sm font-medium text-foreground">Foro activo visible</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              La cabecera deja claro donde estas leyendo o publicando en todo momento.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-4">
            <div className="mb-3 inline-flex size-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <ImagePlus className="size-5" />
            </div>
            <p className="text-sm font-medium text-foreground">Galeria adaptable</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Las publicaciones pueden ir sin fotos o traer una, dos, tres o cuatro.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-4">
            <div className="mb-3 inline-flex size-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <BookOpenText className="size-5" />
            </div>
            <p className="text-sm font-medium text-foreground">Lectura con estructura</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Directorio de foros, contexto actual y feed conviven en una sola vista clara.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-[1.5rem] border border-border/70 bg-card/90 p-5 shadow-sm"
          >
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{stat.value}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{stat.detail}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
