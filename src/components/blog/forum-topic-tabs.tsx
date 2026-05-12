import { Flame, Layers3 } from 'lucide-react'

import { cn } from '@/lib/utils'

import type { ForumTopic } from './blog-types'

type ForumTopicTabsProps = {
  topics: ForumTopic[]
  activeTopicId: string
}

export function ForumTopicTabs({ topics, activeTopicId }: ForumTopicTabsProps) {
  return (
    <section className="rounded-[1.75rem] border border-border/70 bg-card/92 p-5 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">Explorar</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
            Temas que ordenan el blog-foro
          </h2>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-4 py-2 text-sm text-muted-foreground">
          <Flame className="size-4 text-primary" />
          3 discusiones nuevas hoy
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {topics.map((topic) => {
          const isActive = topic.id === activeTopicId

          return (
            <button
              key={topic.id}
              type="button"
              className={cn(
                'rounded-[1.4rem] border p-4 text-left transition-all',
                isActive
                  ? 'border-primary/30 bg-primary/8 shadow-sm'
                  : 'border-border/70 bg-background/75 hover:border-primary/20 hover:bg-primary/5',
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">{topic.label}</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs text-muted-foreground">
                  <Layers3 className="size-3.5" />
                  {topic.count}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{topic.description}</p>
            </button>
          )
        })}
      </div>
    </section>
  )
}
