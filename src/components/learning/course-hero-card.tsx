import { BookOpen } from 'lucide-react'

import type { CourseDetail } from '@/components/learning/course-learning-types'

type CourseHeroCardProps = {
  course: CourseDetail | null
  totalLessons: number
  unitCount: number
}

export function CourseHeroCard({ course, totalLessons, unitCount }: CourseHeroCardProps) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/90 shadow-[0_28px_80px_-46px_rgba(0,137,123,0.45)] backdrop-blur">
      <div className="border-b border-border/70 bg-linear-to-br from-primary/12 via-secondary/10 to-accent/12 px-7 py-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-3 py-1 text-xs font-medium tracking-[0.24em] text-primary uppercase">
          <BookOpen className="h-3.5 w-3.5" />
          Curso
        </div>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance md:text-5xl">
          {course?.name || 'Curso sin nombre'}
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
          {course?.description?.trim() || 'Este curso aun no tiene descripcion.'}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
            {unitCount} unidades
          </span>
          <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
            {totalLessons} lecciones
          </span>
          {course?.author_username ? (
            <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
              Creado por {course.author_username}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
