import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight } from 'lucide-react'

import { cn } from '@/lib/utils'

type MetricTone = 'primary' | 'secondary' | 'accent'

type ToolsHeroCardProps = {
  eyebrow: string
  title: string
  description: string
  highlights: string[]
  children?: ReactNode
}

type ToolsMetricCardProps = {
  icon: LucideIcon
  label: string
  value: string
  description: string
  change?: string
  tone?: MetricTone
}

type ToolsStoryCardItem = {
  label: string
  value: string
  helper: string
}

type ToolsStoryCardProps = {
  icon: LucideIcon
  title: string
  description: string
  items: ToolsStoryCardItem[]
  tone?: MetricTone
}

type ToolsProgressCardItem = {
  label: string
  value: number
  helper: string
}

type ToolsProgressCardProps = {
  icon: LucideIcon
  title: string
  description: string
  items: ToolsProgressCardItem[]
  footer: string
}

const toneClasses: Record<MetricTone, string> = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/20 text-secondary-foreground',
  accent: 'bg-accent/15 text-accent',
}

export function ToolsHeroCard({
  eyebrow,
  title,
  description,
  highlights,
  children,
}: ToolsHeroCardProps) {
  return (
    <article className="relative overflow-hidden rounded-[2rem] border border-border bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_10%,white),color-mix(in_oklab,var(--accent)_8%,white))] p-8 shadow-sm dark:bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_20%,black),color-mix(in_oklab,var(--accent)_15%,black))] sm:p-10">
      <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
      <div className="absolute -right-12 top-8 h-48 w-48 rounded-full bg-accent/15 blur-3xl" />

      <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div className="space-y-5">
          <span className="inline-flex items-center rounded-full bg-background/70 px-4 py-2 text-sm font-medium text-primary backdrop-blur">
            {eyebrow}
          </span>
          <div className="space-y-3">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              {title}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              {description}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {highlights.map((highlight) => (
              <span
                key={highlight}
                className="rounded-full border border-border/70 bg-card/80 px-4 py-2 text-sm font-medium text-foreground shadow-sm backdrop-blur"
              >
                {highlight}
              </span>
            ))}
          </div>
        </div>

        {children ? (
          <div className="rounded-[1.75rem] border border-border/70 bg-card/90 p-6 shadow-sm backdrop-blur">
            {children}
          </div>
        ) : null}
      </div>
    </article>
  )
}

export function ToolsMetricCard({
  icon: Icon,
  label,
  value,
  description,
  change,
  tone = 'primary',
}: ToolsMetricCardProps) {
  return (
    <article className="rounded-[1.5rem] border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30">
      <div className="flex items-start justify-between gap-3">
        <div className={cn('inline-flex rounded-2xl p-3', toneClasses[tone])}>
          <Icon className="size-5" />
        </div>
        {change ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
            <ArrowUpRight className="size-3.5" />
            {change}
          </span>
        ) : null}
      </div>

      <p className="mt-4 text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </article>
  )
}

export function ToolsStoryCard({
  icon: Icon,
  title,
  description,
  items,
  tone = 'secondary',
}: ToolsStoryCardProps) {
  return (
    <article className="rounded-[1.75rem] border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className={cn('inline-flex rounded-2xl p-3', toneClasses[tone])}>
          <Icon className="size-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-lg font-semibold tracking-tight">{item.value}</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.helper}</p>
          </div>
        ))}
      </div>
    </article>
  )
}

export function ToolsProgressCard({
  icon: Icon,
  title,
  description,
  items,
  footer,
}: ToolsProgressCardProps) {
  return (
    <article className="rounded-[1.75rem] border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
          <Icon className="size-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {items.map((item) => {
          const progressWidth = Math.max(10, Math.min(100, item.value))

          return (
            <div key={item.label}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-sm font-semibold text-primary">{item.value}%</p>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-secondary/30">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,var(--primary),color-mix(in_oklab,var(--accent)_65%,white))]"
                  style={{ width: `${progressWidth}%` }}
                />
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.helper}</p>
            </div>
          )
        })}
      </div>

      <div className="mt-6 rounded-[1.25rem] border border-primary/15 bg-primary/6 p-4 text-sm leading-6 text-muted-foreground">
        {footer}
      </div>
    </article>
  )
}
