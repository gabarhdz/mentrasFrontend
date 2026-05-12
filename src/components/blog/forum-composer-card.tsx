import { type ChangeEvent, type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ImagePlus, LoaderCircle, Send, Sparkles, X } from 'lucide-react'

import type { ForumComposerPayload, ForumRecord } from './blog-types'

type ForumComposerCardProps = {
  activeForum: ForumRecord | null
  isExpanded: boolean
  canPublish?: boolean
  isSubmitting?: boolean
  errorMessage?: string | null
  successMessage?: string | null
  onExpandChange: (nextValue: boolean) => void
  onSubmit: (payload: ForumComposerPayload) => Promise<void>
}

const formatFileSize = (size: number) => {
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function ForumComposerCard({
  activeForum,
  isExpanded,
  canPublish = false,
  isSubmitting = false,
  errorMessage,
  successMessage,
  onExpandChange,
  onSubmit,
}: ForumComposerCardProps) {
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [openSection, setOpenSection] = useState<'content' | 'images'>('content')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const previewItems = useMemo(
    () =>
      imageFiles.map((file, index) => ({
        id: `${file.name}-${index}-${file.size}`,
        name: file.name,
        sizeLabel: formatFileSize(file.size),
        previewUrl: URL.createObjectURL(file),
      })),
    [imageFiles],
  )

  useEffect(() => {
    setTitle('')
    setText('')
    setImageFiles([])
    setOpenSection('content')
  }, [activeForum?.id])

  useEffect(() => {
    if (!successMessage) {
      return
    }

    setTitle('')
    setText('')
    setImageFiles([])
    setOpenSection('content')
    onExpandChange(false)
  }, [successMessage, onExpandChange])

  useEffect(() => {
    return () => {
      previewItems.forEach((item) => URL.revokeObjectURL(item.previewUrl))
    }
  }, [previewItems])

  const handleFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files ?? []).slice(0, 4)
    setImageFiles(nextFiles)
  }

  const handleRemoveFile = (index: number) => {
    setImageFiles((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    await onSubmit({
      title: title.trim(),
      text: text.trim(),
      imageFiles,
    })
  }

  if (!isExpanded) {
    return (
      <section className="rounded-[1.75rem] border border-border/70 bg-card/92 p-5 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">
              Crear publicacion
            </p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
              {activeForum ? `Publicar en ${activeForum.name}` : 'Selecciona un foro para empezar'}
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              El flujo prioriza leer primero. Cuando quieras compartir, abres el composer y adjuntas fotos como archivos.
            </p>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => onExpandChange(true)}
          >
            <Sparkles className="size-4" />
            Crear publicacion
          </button>
        </div>
      </section>
    )
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
              El formulario queda ligado al foro activo y las imagenes se agregan desde tu dispositivo con vista previa.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="rounded-full border border-border/70 bg-background px-4 py-2 text-sm text-muted-foreground transition hover:bg-muted"
          onClick={() => onExpandChange(false)}
        >
          Cerrar
        </button>
      </div>

      <form className="mt-5 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-4">
          <p className="text-sm font-medium text-foreground">
            {activeForum ? `Foro seleccionado: ${activeForum.name}` : 'Aun no hay un foro seleccionado'}
          </p>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            Completa el titulo, el contenido y agrega hasta cuatro imagenes si el post las necesita.
          </p>
        </div>

        <section className="overflow-hidden rounded-[1.35rem] border border-border/70 bg-background/70">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
            onClick={() => setOpenSection((current) => (current === 'content' ? 'images' : 'content'))}
          >
            <div>
              <p className="text-sm font-medium text-foreground">1. Contenido del post</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Titulo y contexto principal de la publicacion.
              </p>
            </div>
            <ChevronDown
              className={`size-5 text-muted-foreground transition-transform ${
                openSection === 'content' ? 'rotate-180' : ''
              }`}
            />
          </button>

          {openSection === 'content' ? (
            <div className="grid gap-4 border-t border-border/70 px-4 py-4">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-foreground">Titulo</span>
                <input
                  className="rounded-[1.15rem] border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary/35"
                  disabled={isSubmitting || !activeForum}
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
                  disabled={isSubmitting || !activeForum}
                  maxLength={2000}
                  placeholder="Explica el contexto, la pregunta o lo que quieres compartir con la comunidad."
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                />
              </label>
            </div>
          ) : null}
        </section>

        <section className="overflow-hidden rounded-[1.35rem] border border-border/70 bg-background/70">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
            onClick={() => setOpenSection((current) => (current === 'images' ? 'content' : 'images'))}
          >
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                <ImagePlus className="size-4 text-primary" />
                2. Imagenes del post
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Adjunta archivos opcionales y revisa su vista previa.
              </p>
            </div>
            <ChevronDown
              className={`size-5 text-muted-foreground transition-transform ${
                openSection === 'images' ? 'rotate-180' : ''
              }`}
            />
          </button>

          {openSection === 'images' ? (
            <div className="border-t border-border/70 px-4 py-4">
              <div className="rounded-[1.35rem] border border-dashed border-border/80 bg-background/70 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                      <ImagePlus className="size-4 text-primary" />
                      Imagenes del post
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Sube hasta 4 archivos y revisa una vista previa antes de publicar.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isSubmitting || !activeForum}
                    className="rounded-full border border-border/70 bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Elegir archivos
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  disabled={isSubmitting || !activeForum}
                  multiple
                  type="file"
                  onChange={handleFilesChange}
                />

                {previewItems.length > 0 ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {previewItems.map((item, index) => (
                      <article
                        key={item.id}
                        className="overflow-hidden rounded-[1.15rem] border border-border/70 bg-card"
                      >
                        <img src={item.previewUrl} alt={item.name} className="aspect-square w-full object-cover" />
                        <div className="flex items-start justify-between gap-2 p-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.sizeLabel}</p>
                          </div>
                          <button
                            type="button"
                            className="rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            onClick={() => handleRemoveFile(index)}
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-[1.15rem] border border-border/70 bg-card px-4 py-3 text-sm text-muted-foreground">
                    No has seleccionado imagenes todavia.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </section>

        {errorMessage ? (
          <div className="rounded-[1.15rem] border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        {!canPublish ? (
          <div className="rounded-[1.15rem] border border-border/70 bg-background/80 px-4 py-3 text-sm text-muted-foreground">
            Puedes escribir y preparar el post, pero necesitas iniciar sesion para publicarlo.
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-[1.15rem] border border-primary/25 bg-primary/8 px-4 py-3 text-sm text-primary">
            {successMessage}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-muted-foreground">
            Puedes publicar sin imagenes o usar hasta cuatro archivos.
          </p>

          <button
            type="submit"
            disabled={isSubmitting || !activeForum}
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
