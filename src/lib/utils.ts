import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const BACKEND_BASE_URL = "http://127.0.0.1:8000/"

export function buildBackendUrl(path = "") {
  const baseUrl = import.meta.env.VITE_BACKEND_URL

  return `${baseUrl}${path}`
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
