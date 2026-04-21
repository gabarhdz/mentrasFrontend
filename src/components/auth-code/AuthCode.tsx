import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, ClipboardEvent, KeyboardEvent } from 'react'
import { buildBackendUrl } from '@/lib/utils'

const otpLength = 6
const resendCooldownSeconds = 180

const AuthCodeCard = () => {
  const [otp, setOtp] = useState<string[]>(() => Array(otpLength).fill(''))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])
  const userId = localStorage.getItem('idUser')
  const resendCooldownKey = userId ? `auth-code-resend-at:${userId}` : null

  useEffect(() => {
    if (!userId) {
      window.location.href = '/auth'
    }
  }, [userId])

  useEffect(() => {
    if (!resendCooldownKey) {
      setRemainingSeconds(0)
      return
    }

    const syncRemainingSeconds = () => {
      const storedResendAt = localStorage.getItem(resendCooldownKey)

      if (!storedResendAt) {
        setRemainingSeconds(0)
        return
      }

      const resendAt = Number(storedResendAt)
      const nextRemainingSeconds = Math.max(0, Math.ceil((resendAt - Date.now()) / 1000))
      setRemainingSeconds(nextRemainingSeconds)

      if (nextRemainingSeconds === 0) {
        localStorage.removeItem(resendCooldownKey)
      }
    }

    syncRemainingSeconds()
    const intervalId = window.setInterval(syncRemainingSeconds, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [resendCooldownKey])

  const getErrorMessage = async (response: Response, fallbackMessage: string) => {
    try {
      const data = await response.json()

      if (typeof data.detail === 'string') {
        return data.detail
      }

      if (typeof data.message === 'string') {
        return data.message
      }

      return fallbackMessage
    } catch {
      return fallbackMessage
    }
  }

  const formatRemainingTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remaining = seconds % 60
    return `${minutes}:${remaining.toString().padStart(2, '0')}`
  }

  const focusInput = (index: number) => {
    inputRefs.current[index]?.focus()
    inputRefs.current[index]?.select()
  }

  const handleChange = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/\D/g, '')

    if (!value) {
      setOtp((currentOtp) => {
        const nextOtp = [...currentOtp]
        nextOtp[index] = ''
        return nextOtp
      })
      return
    }

    const digit = value.slice(-1)

    setOtp((currentOtp) => {
      const nextOtp = [...currentOtp]
      nextOtp[index] = digit
      return nextOtp
    })

    if (index < otpLength - 1) {
      focusInput(index + 1)
    }
  }

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      focusInput(index - 1)
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault()
      focusInput(index - 1)
    }

    if (event.key === 'ArrowRight' && index < otpLength - 1) {
      event.preventDefault()
      focusInput(index + 1)
    }
  }

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()

    const pastedDigits = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, otpLength)
      .split('')

    if (!pastedDigits.length) {
      return
    }

    setOtp((currentOtp) => {
      const nextOtp = [...currentOtp]

      pastedDigits.forEach((digit, index) => {
        nextOtp[index] = digit
      })

      return nextOtp
    })

    const nextFocusIndex = Math.min(pastedDigits.length, otpLength - 1)
    focusInput(nextFocusIndex)
  }

  const handleSubmit = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    setFeedback(null)

    if (!userId) {
      setFeedback({
        type: 'error',
        message: 'No encontramos el usuario para validar el codigo. Volve a registrarte.',
      })
      return
    }

    const verificationCode = otp.join('')

    if (verificationCode.length !== otpLength) {
      setFeedback({
        type: 'error',
        message: 'Ingresa el codigo completo de 6 digitos.',
      })
      return
    }

    const formData = new FormData()
    formData.append('code', verificationCode)

    setIsSubmitting(true)

    try {      
      const response = await fetch(buildBackendUrl(`/api/user/activate-email/${userId}/`), {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'No se pudo verificar el codigo.'))
      }

      setFeedback({
        type: 'success',
        message: 'Codigo verificado correctamente.',
      })
      window.location.href = '/auth'
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Ocurrio un error al verificar el codigo.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendCode = async () => {
    setFeedback(null)

    if (!userId) {
      setFeedback({
        type: 'error',
        message: 'No encontramos el usuario para reenviar el codigo. Volve a registrarte.',
      })
      return
    }

    if (remainingSeconds > 0) {
      setFeedback({
        type: 'error',
        message: `Debes esperar ${formatRemainingTime(remainingSeconds)} para reenviar otro codigo.`,
      })
      return
    }

    setIsResending(true)

    try {
      const response = await fetch(buildBackendUrl(`/api/user/resend-code/${userId}/`), {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'No se pudo reenviar el codigo.'))
      }

      const resendAt = Date.now() + resendCooldownSeconds * 1000
      if (resendCooldownKey) {
        localStorage.setItem(resendCooldownKey, resendAt.toString())
      }
      setRemainingSeconds(resendCooldownSeconds)
      setFeedback({
        type: 'success',
        message: 'Te enviamos un nuevo codigo al correo. Debes esperar 3 minutos para pedir otro.',
      })
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Ocurrio un error al reenviar el codigo.',
      })
    } finally {
      setIsResending(false)
    }
  }

  return (
    <>
      <div
        className="[--shadow:rgba(60,64,67,0.3)_0_1px_2px_0,rgba(60,64,67,0.15)_0_2px_6px_2px] h-auto w-5/6 max-w-md space-y-4"
      >
        <div
          className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl bg-white p-4 [box-shadow:var(--shadow)]"
        >
          <h6 className="text-2xl font-bold">Código de verificacion</h6>

          {feedback && (
            <div
              className={`mt-4 w-full rounded-md border px-4 py-3 text-sm ${
                feedback.type === 'success'
                  ? 'border-primary/30 bg-primary/10 text-foreground'
                  : 'border-destructive/30 bg-destructive/10 text-foreground'
              }`}
            >
              {feedback.message}
            </div>
          )}

          <div
            className="my-6 flex w-full items-center justify-center gap-3"
          >
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputRefs.current[index] = element
                }}
                className="hide-number-spin aria-[disabled='true']:cursor-not-allowed aria-[disabled='true']:opacity-50 block h-10 w-10 max-w-full rounded-md border border-input bg-white p-0 text-center text-[20px] leading-[20px] font-bold transition-colors placeholder:text-[24px] placeholder:text-muted-foreground/80 placeholder:select-none focus:placeholder:opacity-0 focus-visible:border-transparent focus-visible:outline-0 focus-visible:ring-2 focus-visible:ring-[#2f81f7] focus-visible:ring-offset-0 [box-shadow:var(--shadow)] file:border-0 file:bg-transparent file:text-sm file:font-medium"
                spellCheck="false"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                placeholder="_"
                aria-invalid="false"
                type="text"
                aria-disabled="false"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(event) => handleChange(index, event)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                onPaste={handlePaste}
                onFocus={(event) => event.target.select()}
              />
            ))}
          </div>

          <span className="text-center text-[12px] text-zinc-500">
            Por favor ingresá el código numérico de 6 dígitos que te enviamos por correo electrónico.
          </span>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isResending}
            className="mt-[14px] w-full rounded-md border border-solid border-transparent bg-primary px-4 py-1 text-base font-medium tracking-wider text-white transition-colors duration-200 hover:bg-sky-600/80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Verificando...' : 'Verify'}
          </button>

          <button
            type="button"
            onClick={handleResendCode}
            disabled={isSubmitting || isResending || remainingSeconds > 0}
            className="mt-3 text-sm font-medium text-primary transition-colors duration-200 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isResending
              ? 'Reenviando codigo...'
              : remainingSeconds > 0
                ? `Reenviar codigo en ${formatRemainingTime(remainingSeconds)}`
                : 'Reenviar codigo'}
          </button>
        </div>

       
      </div>
    </>
  )
}

export default AuthCodeCard
