import { Navigate } from 'react-router-dom'

import { useAuth } from '../auth/AuthContext.jsx'

/**
 * Guards a page:
 * - not logged in        -> go to /login
 * - logged in, wrong role -> go to your own dashboard
 *
 * This is only a UX convenience. The backend checks the JWT again on every
 * request, which is what actually protects the data.
 */
export default function ProtectedRoute({ role, children }) {
  const { auth } = useAuth()

  if (!auth) {
    return <Navigate to="/login" replace />
  }
  if (role && auth.role !== role) {
    return <Navigate to={auth.role === 'MANAGER' ? '/manager' : '/employee'} replace />
  }
  return children
}
