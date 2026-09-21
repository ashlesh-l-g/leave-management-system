import { createContext, useContext, useMemo, useState } from 'react'

import { api } from '../api.js'
import { clearAuth, loadAuth, saveAuth } from './authStorage.js'

/**
 * React Context = a way to share state with many components without passing
 * props through every level. Here it holds "who is logged in".
 *
 * Any component can read it with: const { auth, login, logout } = useAuth()
 */
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => loadAuth())

  const value = useMemo(
    () => ({
      auth,
      login: async (email, password) => {
        const data = await api.login({ email, password })
        saveAuth(data)
        setAuth(data)
        return data
      },
      register: async (name, email, password) => {
        const data = await api.register({ name, email, password })
        saveAuth(data)
        setAuth(data)
        return data
      },
      logout: () => {
        clearAuth()
        setAuth(null)
      },
    }),
    [auth],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth() must be used inside <AuthProvider>')
  }
  return context
}
