import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

const PRODUCTION_API_URL = 'https://mentras-backend-production.up.railway.app'

const configuredApiUrl =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000' : PRODUCTION_API_URL)

export const BACKEND_BASE_URL = configuredApiUrl.trim().replace(/\/$/, '')

export function buildBackendUrl(path = "") {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${BACKEND_BASE_URL}${normalizedPath}`
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
