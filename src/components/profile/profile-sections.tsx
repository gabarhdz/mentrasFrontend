import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

type ProfileHeroCardProps = {
  eyebrow: string
  title: string
  description: string
  chips: string[]
  children?: ReactNode
}

type ProfileMetricCardProps = {
  icon: LucideIcon
  label: string
  value: string
  helper: string
  tone?: 'primary' | 'secondary' | 'accent'
}

type ProfileDetailCardProps = {
  icon: LucideIcon
  title: string
  description?: string
  children: ReactNode
  className?: string
}

type ProfileQuickActionCardProps = {
  icon: LucideIcon
  title: string
  description: string
  href: string
}

const toneClasses = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/20 text-secondary-foreground',
  accent: 'bg-accent/15 text-accent',
}

export function ProfileHeroCard({
  eyebrow,
  title,
  description,
  chips,
  children,
}: ProfileHeroCardProps) {
  return (
    <article className="relative overflow-hidden rounded-[2rem] border border-border bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_10%,white),color-mix(in_oklab,var(--secondary)_10%,white))] p-8 shadow-sm dark:bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_18%,black),color-mix(in_oklab,var(--secondary)_14%,black))] sm:p-10">
      <div className="absolute -right-16 top-0 h-40 w-40 rounded-full bg-accent/15 blur-3xl" />
      <div className="absolute left-10 top-10 h-24 w-24 rounded-full bg-primary/15 blur-3xl" />

      <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="space-y-5">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            {eyebrow}
          </span>
          <div className="space-y-3">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              {title}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              {description}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {chips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-border/70 bg-card/85 px-4 py-2 text-sm font-medium text-foreground shadow-sm backdrop-blur"
              >
                {chip}
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

export function ProfileMetricCard({
  icon: Icon,
  label,
  value,
  helper,
  tone = 'primary',
}: ProfileMetricCardProps) {
  return (
    <article className="rounded-[1.5rem] border border-border bg-card p-5 shadow-sm transition-transform duration-300 hover:-translate-y-1">
      <div className={cn('inline-flex rounded-2xl p-3', toneClasses[tone])}>
        <Icon className="size-5" />
      </div>
      <p className="mt-4 text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{helper}</p>
    </article>
  )
}

export function ProfileDetailCard({
  icon: Icon,
  title,
  description,
  children,
  className,
}: ProfileDetailCardProps) {
  return (
    <article className={cn('rounded-[1.75rem] border border-border bg-card p-6 shadow-sm', className)}>
      <div className="flex items-start gap-4">
        <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          {description ? (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-6">{children}</div>
    </article>
  )
}

export function ProfileQuickActionCard({
  icon: Icon,
  title,
  description,
  href,
}: ProfileQuickActionCardProps) {
  return (
    <a
      href={href}
      className="group flex h-full flex-col justify-between rounded-[1.5rem] border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40"
    >
      <div>
        <div className="inline-flex rounded-2xl bg-secondary/20 p-3 text-secondary-foreground">
          <Icon className="size-5" />
        </div>
        <h3 className="mt-4 text-lg font-semibold tracking-tight">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <span className="mt-6 text-sm font-semibold text-primary transition-transform group-hover:translate-x-1">
        Abrir
      </span>
    </a>
  )
}
