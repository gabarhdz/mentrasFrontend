import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'

import { buildBackendUrl } from '@/lib/utils'

const socialProviders = [
  { id: 'google', label: 'Continuar con Google', badge: <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><path fill="#fff" d="M44.59 4.21a63.28 63.28 0 0 0 4.33 120.9a67.6 67.6 0 0 0 32.36.35a57.13 57.13 0 0 0 25.9-13.46a57.44 57.44 0 0 0 16-26.26a74.3 74.3 0 0 0 1.61-33.58H65.27v24.69h34.47a29.72 29.72 0 0 1-12.66 19.52a36.2 36.2 0 0 1-13.93 5.5a41.3 41.3 0 0 1-15.1 0A37.2 37.2 0 0 1 44 95.74a39.3 39.3 0 0 1-14.5-19.42a38.3 38.3 0 0 1 0-24.63a39.25 39.25 0 0 1 9.18-14.91A37.17 37.17 0 0 1 76.13 27a34.3 34.3 0 0 1 13.64 8q5.83-5.8 11.64-11.63c2-2.09 4.18-4.08 6.15-6.22A61.2 61.2 0 0 0 87.2 4.59a64 64 0 0 0-42.61-.38"/><path fill="#e33629" d="M44.59 4.21a64 64 0 0 1 42.61.37a61.2 61.2 0 0 1 20.35 12.62c-2 2.14-4.11 4.14-6.15 6.22Q95.58 29.23 89.77 35a34.3 34.3 0 0 0-13.64-8a37.17 37.17 0 0 0-37.46 9.74a39.25 39.25 0 0 0-9.18 14.91L8.76 35.6A63.53 63.53 0 0 1 44.59 4.21"/><path fill="#f8bd00" d="M3.26 51.5a63 63 0 0 1 5.5-15.9l20.73 16.09a38.3 38.3 0 0 0 0 24.63q-10.36 8-20.73 16.08a63.33 63.33 0 0 1-5.5-40.9"/><path fill="#587dbd" d="M65.27 52.15h59.52a74.3 74.3 0 0 1-1.61 33.58a57.44 57.44 0 0 1-16 26.26c-6.69-5.22-13.41-10.4-20.1-15.62a29.72 29.72 0 0 0 12.66-19.54H65.27c-.01-8.22 0-16.45 0-24.68"/><path fill="#319f43" d="M8.75 92.4q10.37-8 20.73-16.08A39.3 39.3 0 0 0 44 95.74a37.2 37.2 0 0 0 14.08 6.08a41.3 41.3 0 0 0 15.1 0a36.2 36.2 0 0 0 13.93-5.5c6.69 5.22 13.41 10.4 20.1 15.62a57.13 57.13 0 0 1-25.9 13.47a67.6 67.6 0 0 1-32.36-.35a63 63 0 0 1-23-11.59A63.7 63.7 0 0 1 8.75 92.4"/></svg> },
  { id: 'microsoft', label: 'Continuar con Microsoft', badge: <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><path fill="#f1511b" d="M121.666 121.666H0V0h121.666z"/><path fill="#80cc28" d="M256 121.666H134.335V0H256z"/><path fill="#00adef" d="M121.663 256.002H0V134.336h121.663z"/><path fill="#fbbc09" d="M256 256.002H134.335V134.336H256z"/></svg>},
  { id: 'meta', label: 'Continuar con Meta/Facebook', badge: <svg xmlns="http://www.w3.org/2000/svg" width="256" height="171" viewBox="0 0 256 171"><defs><linearGradient id="SVGYeLhubCc" x1="13.878%" x2="89.144%" y1="55.934%" y2="58.694%"><stop offset="0%" stop-color="#0064e1"/><stop offset="40%" stop-color="#0064e1"/><stop offset="83%" stop-color="#0073ee"/><stop offset="100%" stop-color="#0082fb"/></linearGradient><linearGradient id="SVGll66Sdsg" x1="54.315%" x2="54.315%" y1="82.782%" y2="39.307%"><stop offset="0%" stop-color="#0082fb"/><stop offset="100%" stop-color="#0064e0"/></linearGradient></defs><path fill="#0081fb" d="M27.651 112.136c0 9.775 2.146 17.28 4.95 21.82c3.677 5.947 9.16 8.466 14.751 8.466c7.211 0 13.808-1.79 26.52-19.372c10.185-14.092 22.186-33.874 30.26-46.275l13.675-21.01c9.499-14.591 20.493-30.811 33.1-41.806C161.196 4.985 172.298 0 183.47 0c18.758 0 36.625 10.87 50.3 31.257C248.735 53.584 256 81.707 256 110.729c0 17.253-3.4 29.93-9.187 39.946c-5.591 9.686-16.488 19.363-34.818 19.363v-27.616c15.695 0 19.612-14.422 19.612-30.927c0-23.52-5.484-49.623-17.564-68.273c-8.574-13.23-19.684-21.313-31.907-21.313c-13.22 0-23.859 9.97-35.815 27.75c-6.356 9.445-12.882 20.956-20.208 33.944l-8.066 14.289c-16.203 28.728-20.307 35.271-28.408 46.07c-14.2 18.91-26.324 26.076-42.287 26.076c-18.935 0-30.91-8.2-38.325-20.556C2.973 139.413 0 126.202 0 111.148z"/><path fill="url(#SVGYeLhubCc)" d="M21.802 33.206C34.48 13.666 52.774 0 73.757 0C85.91 0 97.99 3.597 110.605 13.897c13.798 11.261 28.505 29.805 46.853 60.368l6.58 10.967c15.881 26.459 24.917 40.07 30.205 46.49c6.802 8.243 11.565 10.7 17.752 10.7c15.695 0 19.612-14.422 19.612-30.927l24.393-.766c0 17.253-3.4 29.93-9.187 39.946c-5.591 9.686-16.488 19.363-34.818 19.363c-11.395 0-21.49-2.475-32.654-13.007c-8.582-8.083-18.615-22.443-26.334-35.352l-22.96-38.352C118.528 64.08 107.96 49.73 101.845 43.23c-6.578-6.988-15.036-15.428-28.532-15.428c-10.923 0-20.2 7.666-27.963 19.39z"/><path fill="url(#SVGll66Sdsg)" d="M73.312 27.802c-10.923 0-20.2 7.666-27.963 19.39c-10.976 16.568-17.698 41.245-17.698 64.944c0 9.775 2.146 17.28 4.95 21.82L9.027 149.482C2.973 139.413 0 126.202 0 111.148C0 83.772 7.514 55.24 21.802 33.206C34.48 13.666 52.774 0 73.757 0z"/></svg> },
]

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [profilePic, setProfilePic] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const toggleForm = () => {
    setFeedback(null)
    setIsLogin(!isLogin)
  }

  useEffect(() => {
    if (!profilePic) {
      setPreviewUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(profilePic)
    setPreviewUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [profilePic])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    const maxFileSize = 5 * 1024 * 1024

    if (file && file.size > maxFileSize) {
      alert('La imagen es demasiado grande. Elige una menor de 5MB.')
      e.target.value = ''
      setProfilePic(null)
      return
    }

    setProfilePic(file)
  }

  const clearSelectedFile = () => {
    setProfilePic(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const resetSignupFields = () => {
    setUsername('')
    setPassword('')
    setEmail('')
    setPhoneNumber('')
    setConfirmPassword('')
    clearSelectedFile()
  }

  const handleSubmit = async (e: ChangeEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFeedback(null)

    if (isLogin) {
      setFeedback({
        type: 'error',
        message: 'El login aun no esta conectado. Por ahora solo esta integrado el registro.',
      })
      return
    }

    if (password !== confirmPassword) {
      setFeedback({
        type: 'error',
        message: 'Las contrasenas no coinciden.',
      })
      return
    }

    if (!profilePic) {
      setFeedback({
        type: 'error',
        message: 'Debes subir una foto de perfil para crear el usuario.',
      })
      return
    }

    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)
    formData.append('profile_pic', profilePic)
    formData.append('email', email)
    formData.append('phone_number', phoneNumber)

    setIsSubmitting(true)

    try {
      const response = await fetch(buildBackendUrl('/api/user/'), {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        let errorMessage = 'No se pudo crear el usuario.'

        try {
          const errorData = await response.json()
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail
          } else if (typeof errorData.message === 'string') {
            errorMessage = errorData.message
          } else {
            errorMessage = JSON.stringify(errorData)
          }
        } catch {
          errorMessage = `No se pudo crear el usuario. Codigo ${response.status}.`
        }

        throw new Error(errorMessage)
      }

      setFeedback({
        type: 'success',
        message: 'Usuario creado correctamente.',
      })
      resetSignupFields()
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Ocurrio un error inesperado.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative z-10 mx-auto max-w-2xl min-h-[44rem] overflow-hidden rounded-lg border border-border bg-card p-8 shadow-md before:absolute before:-z-10 before:h-24 before:w-24 before:rounded-full before:bg-primary/30 before:blur-2xl after:absolute after:top-24 after:-right-12 after:-z-10 after:h-32 after:w-32 after:rounded-full after:bg-primary/25 after:blur-xl">
      <h2 className="mb-6 text-2xl font-bold text-foreground">
        {isLogin ? 'Inicia sesion en Mentras' : 'Crea tu cuenta en Mentras'}
      </h2>

      <form method="post" action="#" className="flex min-h-[calc(44rem-7rem)] flex-col justify-center" onSubmit={handleSubmit}>
        <div className="space-y-6">
          {feedback && (
            <div
              className={`rounded-md border px-4 py-3 text-sm ${
                feedback.type === 'success'
                  ? 'border-primary/30 bg-primary/10 text-foreground'
                  : 'border-destructive/30 bg-destructive/10 text-foreground'
              }`}
            >
              {feedback.message}
            </div>
          )}

          <div className={`grid gap-4 ${isLogin ? 'grid-cols-1' : 'md:grid-cols-2'}`}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-muted-foreground" htmlFor="username">
                Username
              </label>
              <input
                className="mt-1 w-full rounded-md border border-input bg-background p-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                name="username"
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-muted-foreground" htmlFor="password">
                Contrasena
              </label>
              <input
                className="mt-1 w-full rounded-md border border-input bg-background p-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                name="password"
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {!isLogin && (
            <fieldset>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-muted-foreground" htmlFor="email">
                    Email
                  </label>
                  <input
                    className="mt-1 w-full rounded-md border border-input bg-background p-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    name="email"
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-muted-foreground" htmlFor="phone-number">
                    Telefono
                  </label>
                  <input
                    className="mt-1 w-full rounded-md border border-input bg-background p-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    name="phone-number"
                    id="phone-number"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-muted-foreground" htmlFor="confirm-password">
                  Confirmar contrasena
                </label>
                <input
                  className="mt-1 w-full rounded-md border border-input bg-background p-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  name="confirm-password"
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <div className="mb-6">
                <label htmlFor="profile-pic" className="block text-sm font-medium text-muted-foreground">
                  Foto de perfil
                </label>
                <div className="mt-2 rounded-xl border border-dashed border-primary/35 bg-background/80 p-4">
                  <input
                    ref={fileInputRef}
                    className="sr-only"
                    name="profile-pic"
                    id="profile-pic"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />

                  <label
                    htmlFor="profile-pic"
                    className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-input bg-card px-4 py-5 text-center transition-colors hover:border-primary/50 hover:bg-muted/40"
                  >
                    <span className="text-sm font-semibold text-foreground">
                      {profilePic ? 'Cambiar imagen' : 'Sube una foto de perfil'}
                    </span>
                    <span className="mt-2 text-sm text-muted-foreground">
                      Toca aqui para elegir una imagen desde tu dispositivo
                    </span>
                    <span className="mt-3 text-xs text-muted-foreground/90">
                      JPG, PNG o WEBP de hasta 5MB
                    </span>
                  </label>

                  {profilePic && previewUrl && (
                    <div className="mt-4 rounded-lg border border-border bg-card p-3">
                      <div className="flex items-start gap-3">
                        <img
                          src={previewUrl}
                          alt="Vista previa de la foto de perfil"
                          className="h-24 w-24 rounded-lg object-cover ring-1 ring-border"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {profilePic.name}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {(profilePic.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <button
                            className="mt-3 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                            onClick={clearSelectedFile}
                            type="button"
                          >
                            Quitar imagen
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </fieldset>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                o entra con
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {socialProviders.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  className="inline-flex items-center justify-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {provider.badge}
                  </span>
                  <span className="leading-tight">{provider.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-end gap-4">
            <button
              className="rounded-md bg-primary px-4 py-2 font-bold text-primary-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enviando...' : isLogin ? 'Iniciar sesion' : 'Registrarme'}
            </button>

            <div className="w-full text-center">
              <button
                className="text-sm font-medium text-primary transition-colors hover:text-accent"
                onClick={toggleForm}
                type="button"
              >
                {isLogin ? 'No tienes cuenta? Registrate' : 'Ya tienes cuenta? Inicia sesion'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default AuthForm
