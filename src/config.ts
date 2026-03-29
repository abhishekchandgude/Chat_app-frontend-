const normalizeUrl = (value: string) => value.replace(/\/$/, '')

export const API_BASE_URL = normalizeUrl(
  import.meta.env.VITE_API_BASE_URL ?? 'https://chat-app-backend-5x7i.onrender.com',
)

export const SOCKET_URL = normalizeUrl(
  import.meta.env.VITE_SOCKET_URL ?? (import.meta.env.DEV ? 'http://localhost:5000' : ''),
)
