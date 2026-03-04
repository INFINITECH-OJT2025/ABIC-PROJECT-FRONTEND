/**
 * Get the backend API base URL.
 * Uses NEXT_PUBLIC_BACKEND_URL for client-side, BACKEND_URL for server-side.
 */
export function getApiUrl(): string {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'
  }
  return process.env.BACKEND_URL || 'http://127.0.0.1:8000'
}