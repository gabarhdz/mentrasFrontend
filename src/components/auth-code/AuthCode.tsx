import { useRef, useState } from 'react'
import type { ChangeEvent, ClipboardEvent, KeyboardEvent } from 'react'
import { buildBackendUrl } from '@/lib/utils'
const otpLength = 6

const AuthCodeCard = () => {
  const [otp, setOtp] = useState<string[]>(() => Array(otpLength).fill(''))
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

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

  const handleSubmit = async (event: React.FormEvent<HTMLButtonElement>) => {
    event.preventDefault()
    const verificationCode = otp.join('')
    const formData = new FormData()
    formData.append('code', verificationCode)
    try {      
      const response = await fetch(buildBackendUrl('/api/user/activate-email/' + localStorage.getItem('idUser')+"/"), {
              method: 'POST',
              body: formData,
            })
            window.location.href = '/profile'
        
    } catch (error) {
      console.error('Error al verificar el código:', error)
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
            className="mt-[14px] w-full rounded-md border border-solid border-transparent bg-primary px-4 py-1 text-base font-medium tracking-wider text-white transition-colors duration-200 hover:bg-sky-600/80"
          >
            Verify
          </button>
        </div>

       
      </div>
    </>
  )
}

export default AuthCodeCard
