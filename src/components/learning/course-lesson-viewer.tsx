import { FileText, PlayCircle } from 'lucide-react'

import type { LessonSummary } from '@/components/learning/course-learning-types'

type CourseLessonViewerProps = {
  selectedLesson: LessonSummary | null
}

export function CourseLessonViewer({ selectedLesson }: CourseLessonViewerProps) {
  return (
    <section className="space-y-5">
      <div className="rounded-[2rem] border border-border/70 bg-card/92 p-6 shadow-sm backdrop-blur">
        <p className="text-xs font-medium tracking-[0.24em] text-muted-foreground uppercase">
          Leccion actual
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          {selectedLesson?.title || 'Selecciona una leccion'}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {selectedLesson
            ? 'Aqui puedes avanzar por el contenido de esta leccion.'
            : 'Elige una leccion del panel izquierdo para empezar.'}
        </p>
      </div>

      {selectedLesson ? (
        <>
          <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/92 shadow-sm backdrop-blur">
            <div className="border-b border-border/70 px-6 py-5">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <PlayCircle className="h-6 w-6 text-primary" />
                Video
              </div>
            </div>
            <div className="p-6 md:p-7">
              {selectedLesson.video ? (
                <video
                  className="aspect-video w-full rounded-[1.75rem] border border-border bg-black shadow-[0_26px_60px_-38px_rgba(0,0,0,0.75)]"
                  controls
                  preload="metadata"
                  src={selectedLesson.video}
                />
              ) : (
                <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5 text-sm text-muted-foreground">
                  Esta leccion todavia no tiene video disponible.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-border/70 bg-card/92 p-6 shadow-sm backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <FileText className="h-4 w-4 text-primary" />
              Material de apoyo
            </div>
            {selectedLesson.pdf ? (
              <a
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                href={selectedLesson.pdf}
                rel="noreferrer"
                target="_blank"
              >
                <FileText className="h-4 w-4" />
                Abrir material en PDF
              </a>
            ) : (
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Esta leccion no tiene material extra por ahora.
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="rounded-[2rem] border border-border/70 bg-card/92 p-6 shadow-sm backdrop-blur">
          <p className="text-sm leading-6 text-muted-foreground">
            Cuando selecciones una leccion, aqui veras su video y el material complementario.
          </p>
        </div>
      )}
    </section>
  )
}
