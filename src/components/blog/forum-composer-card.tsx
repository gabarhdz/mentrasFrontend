import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react'
import { ImagePlus, LoaderCircle, Send, Sparkles } from 'lucide-react'

import type { ForumComposerPayload, ForumRecord } from './blog-types'

type ForumComposerCardProps = {
  activeForum: ForumRecord | null
  disabled?: boolean
  isSubmitting?: boolean
  errorMessage?: string | null
  successMessage?: string | null
  onSubmit: (payload: ForumComposerPayload) => Promise<void>
}

const createEmptyImageInputs = () => ['', '', '', '']

export function ForumComposerCard({
  activeForum,
  disabled = false,
  isSubmitting = false,
  errorMessage,
  successMessage,
  onSubmit,
}: ForumComposerCardProps) {
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [imageInputs, setImageInputs] = useState<string[]>(createEmptyImageInputs())

  useEffect(() => {
    setTitle('')
    setText('')
    setImageInputs(createEmptyImageInputs())
  }, [activeForum?.id])

  useEffect(() => {
    if (!successMessage) {
      return
    }

    setTitle('')
    setText('')
    setImageInputs(createEmptyImageInputs())
  }, [successMessage])

  const handleImageChange = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value

    setImageInputs((current) =>
      current.map((value, currentIndex) => (currentIndex === index ? nextValue : value)),
    )
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    await onSubmit({
      title: title.trim(),
      text: text.trim(),
      imageUrls: imageInputs.map((value) => value.trim()).filter(Boolean),
    })
  }

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
              Nuevo post
            </div>
            <h3 className="text-xl font-semibold tracking-tight text-foreground">
              {activeForum ? `Publicar en ${activeForum.name}` : 'Selecciona un foro para publicar'}
            </h3>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              El formulario queda amarrado al foro activo para que siempre se vea claramente donde se
              publicara la entrada.
            </p>
          </div>
        </div>
      </div>

      <form className="mt-5 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-4">
          <p className="text-sm font-medium text-foreground">
            {activeForum ? `Foro seleccionado: ${activeForum.name}` : 'Aun no hay un foro seleccionado'}
          </p>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            Completa el titulo, el contenido y, si quieres, agrega hasta cuatro URLs de imagen.
          </p>
        </div>

        <div className="grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">Titulo</span>
            <input
              className="rounded-[1.15rem] border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary/35"
              disabled={disabled || isSubmitting || !activeForum}
              maxLength={100}
              placeholder="Ejemplo: Probamos una nueva vitrina y necesito feedback"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">Contenido</span>
            <textarea
              className="min-h-36 rounded-[1.15rem] border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary/35"
              disabled={disabled || isSubmitting || !activeForum}
              maxLength={2000}
              placeholder="Explica el contexto, la pregunta o lo que quieres compartir con la comunidad."
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {imageInputs.map((value, index) => (
            <label
              key={`image-input-${index + 1}`}
              className="grid gap-2 rounded-[1.3rem] border border-dashed border-border/80 bg-background/70 p-4"
            >
              <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                <ImagePlus className="size-4 text-primary" />
                Imagen opcional {index + 1}
              </span>
              <input
                className="rounded-[1rem] border border-border bg-card px-3 py-2 text-sm outline-none transition focus:border-primary/35"
                disabled={disabled || isSubmitting || !activeForum}
                placeholder="https://..."
                value={value}
                onChange={(event) => handleImageChange(index, event)}
              />
            </label>
          ))}
        </div>

        {errorMessage ? (
          <div className="rounded-[1.15rem] border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-[1.15rem] border border-primary/25 bg-primary/8 px-4 py-3 text-sm text-primary">
            {successMessage}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-muted-foreground">
            Puedes dejar las imagenes vacias o usar las cuatro si el caso lo necesita.
          </p>

          <button
            type="submit"
            disabled={disabled || isSubmitting || !activeForum}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
            Publicar
          </button>
        </div>
      </form>
    </section>
  )
}
