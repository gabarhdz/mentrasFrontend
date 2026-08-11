import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const BACKEND_BASE_URL = (import.meta.env.VITE_BACKEND_URL ?? '').trim().replace(/\/$/, '')

export function buildBackendUrl(path = "") {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${BACKEND_BASE_URL}${normalizedPath}`
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
