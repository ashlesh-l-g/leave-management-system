import { Navigate, Route, Routes } from 'react-router-dom'

import Navbar from './components/Navbar.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { useAuth } from './auth/AuthContext.jsx'
import EmployeeDashboard from './pages/EmployeeDashboard.jsx'
import Login from './pages/Login.jsx'
import ManagerDashboard from './pages/ManagerDashboard.jsx'
import Register from './pages/Register.jsx'

/**
 * The route table. Each <Route> says: "when the URL is this, render that page".
 * Wrapping a page in <ProtectedRoute> redirects visitors who are not logged in
 * (or who have the wrong role) instead of showing it.
 */
export default function App() {
  const { auth } = useAuth()

  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Navigate to={homePath(auth)} replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/employee"
            element={
              <ProtectedRoute role="EMPLOYEE">
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager"
            element={
              <ProtectedRoute role="MANAGER">
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
      </main>
    </>
  )
}

function homePath(auth) {
  if (!auth) return '/login'
  return auth.role === 'MANAGER' ? '/manager' : '/employee'
}
