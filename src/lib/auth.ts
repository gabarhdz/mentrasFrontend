import { buildBackendUrl } from '@/lib/utils'

const ACCESS_TOKEN_KEY = 'mentras.access_token'
const REFRESH_TOKEN_KEY = 'mentras.refresh_token'
const LEGACY_ACCESS_TOKEN_KEY = 'jwt_token'
const USER_ID_KEY = 'idUser'
const EXPIRATION_BUFFER_SECONDS = 20

let accessTokenCache: string | null = null
let refreshRequest: Promise<string | null> | null = null

type AuthTokens = {
  access?: string
  refresh?: string
}

const resolveTokenUserId = (token: string) => {
  const payload = decodeJwtPayload(token)

  if (!payload || typeof payload !== 'object') {
    return null
  }

  const candidate =
    typeof payload.user_id === 'string' || typeof payload.user_id === 'number'
      ? payload.user_id
      : typeof payload.id === 'string' || typeof payload.id === 'number'
        ? payload.id
        : typeof payload.sub === 'string' || typeof payload.sub === 'number'
          ? payload.sub
          : null

  return candidate === null ? null : String(candidate)
}

const decodeJwtPayload = (token: string) => {
  try {
    const base64Url = token.split('.')[1]

    if (!base64Url) {
      return null
    }

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    return JSON.parse(window.atob(padded))
  } catch {
    return null
  }
}

export const getAccessToken = () => {
  if (accessTokenCache) {
    return accessTokenCache
  }

  const sessionToken = sessionStorage.getItem(ACCESS_TOKEN_KEY)

  if (sessionToken) {
    accessTokenCache = sessionToken
    return sessionToken
  }

  const legacyToken = localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY)

  if (legacyToken) {
    setAccessToken(legacyToken)
    localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY)
    return legacyToken
  }

  return null
}

export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY)

export const getStoredUserId = () => {
  const storedUserId = localStorage.getItem(USER_ID_KEY)

  if (storedUserId) {
    return storedUserId
  }

  const token = getAccessToken()

  if (!token) {
    return null
  }

  const tokenUserId = resolveTokenUserId(token)

  if (tokenUserId) {
    localStorage.setItem(USER_ID_KEY, tokenUserId)
  }

  return tokenUserId
}

export const setAccessToken = (token: string) => {
  accessTokenCache = token
  sessionStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export const setRefreshToken = (token: string) => {
  localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

export const setStoredUserId = (userId: string) => {
  localStorage.setItem(USER_ID_KEY, userId)
}

export const saveAuthTokens = ({ access, refresh }: AuthTokens) => {
  if (access) {
    setAccessToken(access)

    const tokenUserId = resolveTokenUserId(access)

    if (tokenUserId) {
      setStoredUserId(tokenUserId)
    }
  }

  if (refresh) {
    setRefreshToken(refresh)
  }
}

export const replaceAuthTokens = ({ access, refresh }: AuthTokens) => {
  accessTokenCache = null
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY)

  saveAuthTokens({ access, refresh })
}

export const clearAuthTokens = () => {
  accessTokenCache = null
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY)
  localStorage.removeItem(USER_ID_KEY)
}

export const hasStoredSession = () => Boolean(getAccessToken() || getRefreshToken())

export const isTokenExpired = (token: string, bufferSeconds = EXPIRATION_BUFFER_SECONDS) => {
  const payload = decodeJwtPayload(token)

  if (!payload || typeof payload.exp !== 'number') {
    return true
  }

  const expiresAtMs = payload.exp * 1000
  return expiresAtMs <= Date.now() + bufferSeconds * 1000
}

export const refreshAccessToken = async () => {
  if (refreshRequest) {
    return refreshRequest
  }

  const refresh = getRefreshToken()

  if (!refresh) {
    clearAuthTokens()
    return null
  }

  refreshRequest = (async () => {
    try {
      const response = await fetch(buildBackendUrl('/api/user/login/refresh/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh }),
      })

      if (!response.ok) {
        clearAuthTokens()
        return null
      }

      const data = await response.json()

      if (typeof data.access !== 'string') {
        clearAuthTokens()
        return null
      }

      saveAuthTokens({
        access: data.access,
        refresh: typeof data.refresh === 'string' ? data.refresh : refresh,
      })

      return data.access
    } catch {
      clearAuthTokens()
      return null
    } finally {
      refreshRequest = null
    }
  })()

  return refreshRequest
}

export const getValidAccessToken = async () => {
  const token = getAccessToken()

  if (token && !isTokenExpired(token)) {
    return token
  }

  return refreshAccessToken()
}

export const authFetch = async (input: string, init: RequestInit = {}) => {
  const token = await getValidAccessToken()
  const headers = new Headers(init.headers)

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response = await fetch(input, {
    ...init,
    headers,
  })

  if (response.status !== 401) {
    return response
  }

  const refreshedAccessToken = await refreshAccessToken()

  if (!refreshedAccessToken) {
    return response
  }

  const retryHeaders = new Headers(init.headers)
  retryHeaders.set('Authorization', `Bearer ${refreshedAccessToken}`)

  response = await fetch(input, {
    ...init,
    headers: retryHeaders,
  })

  return response
}
