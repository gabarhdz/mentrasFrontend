import { PlayCircle } from 'lucide-react'

import type { UnitSummary } from '@/components/learning/course-learning-types'

type CourseOutlinePanelProps = {
  selectedLessonId: string
  onSelectLesson: (lessonId: string) => void
  units: UnitSummary[]
}

export function CourseOutlinePanel({
  selectedLessonId,
  onSelectLesson,
  units,
}: CourseOutlinePanelProps) {
  return (
    <div className="rounded-[2rem] border border-border/70 bg-card/92 p-6 backdrop-blur">
      <p className="text-xs font-medium tracking-[0.24em] text-muted-foreground uppercase">
        Contenido
      </p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight">Unidades y lecciones</h2>

      {!units.length ? (
        <div className="mt-4 rounded-[1.5rem] border border-border/70 bg-background/70 p-4 text-sm leading-6 text-muted-foreground">
          Este curso todavia no tiene contenido disponible.
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {units.map((unit, unitIndex) => (
            <article
              key={unit.id ?? `${unit.title}-${unitIndex}`}
              className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {unit.title || `Unidad ${unitIndex + 1}`}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {unit.description?.trim() || 'Esta unidad aun no tiene descripcion.'}
                  </p>
                </div>
                <span className="rounded-full border border-border/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                  {unit.lessons?.length ?? 0} lecciones
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {unit.lessons?.length ? (
                  unit.lessons.map((lesson, lessonIndex) => {
                    const isActive = lesson.id === selectedLessonId

                    return (
                      <button
                        key={lesson.id ?? `${unit.id}-${lessonIndex}`}
                        className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                          isActive
                            ? 'border-primary/30 bg-primary/8'
                            : 'border-border/70 bg-background/80 hover:bg-muted'
                        }`}
                        type="button"
                        onClick={() => onSelectLesson(lesson.id ?? '')}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-full ${
                              isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            <PlayCircle className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {lesson.title || `Leccion ${lessonIndex + 1}`}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Toca para abrir esta leccion
                            </p>
                          </div>
                        </div>
                      </button>
                    )
                  })
                ) : (
                  <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                    Esta unidad todavia no tiene lecciones.
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
