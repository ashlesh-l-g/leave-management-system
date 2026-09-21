// The JWT and the basic user info are kept in localStorage so that refreshing
// the page does not log you out. This is fine for a learning project; a real
// app would use httpOnly cookies.
const AUTH_STORAGE_KEY = 'lms_auth'

export function saveAuth(auth) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth))
}

export function loadAuth() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    clearAuth()
    return null
  }
}

export function clearAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

/** Used by the API helper to build the "Authorization: Bearer ..." header. */
export function getToken() {
  const auth = loadAuth()
  return auth ? auth.token : null
}
