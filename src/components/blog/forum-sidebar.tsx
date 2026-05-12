import { BadgeCheck, Camera, ShieldCheck } from 'lucide-react'

import type { SidebarHighlight } from './blog-types'

type ForumSidebarProps = {
  highlights: SidebarHighlight[]
}

export function ForumSidebar({ highlights }: ForumSidebarProps) {
  return (
    <aside className="space-y-5">
      <section className="rounded-[1.75rem] border border-border/70 bg-card/92 p-5 shadow-sm backdrop-blur">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">Moderacion ligera</p>
        <h3 className="mt-3 text-xl font-semibold tracking-tight text-foreground">
          Reglas base para mantener el foro util
        </h3>

        <div className="mt-5 space-y-3">
          {highlights.map((highlight) => (
            <article
              key={highlight.title}
              className="rounded-[1.35rem] border border-border/70 bg-background/75 p-4"
            >
              <div className="mb-3 inline-flex size-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                <ShieldCheck className="size-5" />
              </div>
              <p className="text-sm font-semibold text-foreground">{highlight.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{highlight.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-border/70 bg-linear-to-br from-card via-card to-primary/8 p-5 shadow-sm">
        <div className="inline-flex size-11 items-center justify-center rounded-[1.1rem] bg-primary/12 text-primary">
          <Camera className="size-5" />
        </div>
        <h3 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
          Componente clave: galeria de post
        </h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          La grilla se adapta segun la cantidad de imagenes. Si el post no trae fotos, la tarjeta sigue
          limpia. Si trae varias, el layout mantiene jerarquia visual sin romper el feed.
        </p>

        <div className="mt-5 rounded-[1.4rem] border border-border/70 bg-background/80 p-4">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
            <BadgeCheck className="size-4 text-primary" />
            Casos contemplados en este prototipo
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {['0 fotos', '1 foto', '2 fotos', '3 fotos', '4 fotos'].map((item) => (
              <span
                key={item}
                className="rounded-full border border-border/70 bg-card px-3 py-1 text-xs text-muted-foreground"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>
    </aside>
  )
}
