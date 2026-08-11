const normalizeEnvValue = (value: unknown) =>
  typeof value === 'string' ? value.trim() : ''

const DEFAULT_GOOGLE_ALLOWED_ORIGINS = [
  'https://mentras-frontend-gywe.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4200',
  'http://127.0.0.1:4200',
]

export const googleClientId = normalizeEnvValue(import.meta.env.VITE_GOOGLE_CLIENT_ID)

const configuredGoogleOrigins = normalizeEnvValue(import.meta.env.VITE_GOOGLE_ALLOWED_ORIGINS)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

export const googleAllowedOrigins = Array.from(
  new Set([...DEFAULT_GOOGLE_ALLOWED_ORIGINS, ...configuredGoogleOrigins]),
)

export const isGoogleOriginAllowed = (origin: string) => googleAllowedOrigins.includes(origin)

export const getGoogleOriginError = (origin: string) => {
  if (!googleClientId) {
    return 'Falta configurar VITE_GOOGLE_CLIENT_ID para habilitar el acceso con Google.'
  }

  if (!isGoogleOriginAllowed(origin)) {
    return `El origen actual ${origin} no esta autorizado para este client ID. Usa ${googleAllowedOrigins[0]} o agrega este origen en Google Cloud Console.`
  }

  return null
}
