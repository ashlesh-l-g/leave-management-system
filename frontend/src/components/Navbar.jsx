import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/AuthContext.jsx'
import { RoleBadge, initials } from './ui.jsx'

/** Top bar: brand on the left, who is logged in and the logout action on the right. */
export default function Navbar() {
  const { auth, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true">
            LM
          </span>
          <span className="brand-text">
            <span className="brand-title">Leave Management</span>
            <span className="brand-sub">System</span>
          </span>
        </Link>

        {auth && (
          <div className="navbar-right">
            <div className="user-chip">
              <span className="avatar" aria-hidden="true">
                {initials(auth.name)}
              </span>
              <span className="user-name">{auth.name}</span>
              <RoleBadge role={auth.role} />
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
