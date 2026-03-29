const normalizeUrl = (value: string) => value.replace(/\/$/, '')

export const API_BASE_URL = normalizeUrl(
  import.meta.env.VITE_API_BASE_URL ?? 'https://codebuddybackend-wwjm.onrender.com',
)

export const SOCKET_URL = normalizeUrl(
  import.meta.env.VITE_SOCKET_URL ?? (import.meta.env.DEV ? 'http://localhost:5000' : ''),
)
