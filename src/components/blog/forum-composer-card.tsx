import { ImagePlus, Send, Sparkles } from 'lucide-react'

const uploadSlots = ['Portada', 'Detalle', 'Proceso', 'Resultado']

export function ForumComposerCard() {
  return (
    <section className="rounded-[1.75rem] border border-border/70 bg-card/92 p-5 shadow-sm backdrop-blur sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4">
          <div className="inline-flex size-12 shrink-0 items-center justify-center rounded-[1.2rem] bg-primary text-sm font-semibold text-primary-foreground">
            TU
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-primary">
              <Sparkles className="size-3.5" />
              Nuevo post del foro
            </div>
            <h3 className="text-xl font-semibold tracking-tight text-foreground">
              Caja de composicion para abrir una conversacion
            </h3>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Este componente deja claro que el blog funciona como foro: escribes un titulo, agregas
              contexto y, si hace falta, adjuntas hasta cuatro fotos para contar mejor la historia.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-95"
        >
          <Send className="size-4" />
          Publicar borrador
        </button>
      </div>

      <div className="mt-5 rounded-[1.5rem] border border-border/70 bg-background/80 p-4">
        <p className="text-sm font-medium text-foreground">Comparte una pregunta, aprendizaje o caso real</p>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          Ejemplo: "Probamos una vitrina nueva esta semana. Quiero feedback sobre orden, mensaje y
          visibilidad del producto."
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {uploadSlots.map((slot) => (
          <button
            key={slot}
            type="button"
            className="flex min-h-28 flex-col items-center justify-center rounded-[1.4rem] border border-dashed border-border/80 bg-background/70 p-4 text-center transition hover:border-primary/30 hover:bg-primary/5"
          >
            <div className="mb-3 inline-flex size-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <ImagePlus className="size-5" />
            </div>
            <p className="text-sm font-medium text-foreground">{slot}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Slot opcional de imagen</p>
          </button>
        ))}
      </div>
    </section>
  )
}
