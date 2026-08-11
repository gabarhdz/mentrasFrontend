import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

const configuredApiUrl =
  import.meta.env.VITE_API_URL ??
  import.meta.env.VITE_BACKEND_URL ??
  (import.meta.env.DEV ? 'http://localhost:8000' : '')

export const BACKEND_BASE_URL = configuredApiUrl.trim().replace(/\/$/, '')

export function buildBackendUrl(path = "") {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${BACKEND_BASE_URL}${normalizedPath}`
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
