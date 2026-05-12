import { BookOpenText, ImagePlus, MessageSquareMore } from 'lucide-react'

import type { CommunityStat } from '@/components/blog/blog-types'
import { SectionHeading } from '@/components/ui/section-heading'

type BlogPageHeroProps = {
  stats: CommunityStat[]
}

export function BlogPageHero({ stats }: BlogPageHeroProps) {
  return (
    <section className="rounded-[2rem] border border-border/70 bg-linear-to-br from-background via-card to-primary/8 p-6 shadow-sm sm:p-8">
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
        <SectionHeading
          badge="Blog + foro"
          title="Un blog conversable donde cada post vive dentro de la comunidad."
          description="Este prototipo plantea la seccion de blog como un espacio de foro: cada entrada tiene autor, categoria, conversacion y una galeria flexible que puede venir vacia o con hasta cuatro fotos."
        />

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-4">
            <div className="mb-3 inline-flex size-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <MessageSquareMore className="size-5" />
            </div>
            <p className="text-sm font-medium text-foreground">Hilos con contexto</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Pensado para publicar, comentar y seguir el aprendizaje en comunidad.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-4">
            <div className="mb-3 inline-flex size-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <ImagePlus className="size-5" />
            </div>
            <p className="text-sm font-medium text-foreground">Galeria adaptable</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              La tarjeta acomoda automaticamente 1, 2, 3 o 4 imagenes.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-4">
            <div className="mb-3 inline-flex size-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <BookOpenText className="size-5" />
            </div>
            <p className="text-sm font-medium text-foreground">Listo para contenido</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Se puede conectar luego con posts reales, categorias y moderacion.
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
