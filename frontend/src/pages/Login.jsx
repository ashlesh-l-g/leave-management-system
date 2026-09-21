import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/AuthContext.jsx'
import { Alert } from '../components/ui.jsx'

const DEMO_ACCOUNTS = [
  { role: 'Employee', email: 'employee@leave.com', password: 'employee123' },
  { role: 'Manager', email: 'manager@leave.com', password: 'manager123' },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('employee@leave.com')
  const [password, setPassword] = useState('employee123')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setFieldErrors({})
    setLoading(true)
    try {
      const auth = await login(email, password)
      navigate(auth.role === 'MANAGER' ? '/manager' : '/employee')
    } catch (err) {
      setError(err.message)
      // Bean Validation failures come back as { errors: { field: message } }.
      setFieldErrors(err.fieldErrors || {})
    } finally {
      setLoading(false)
    }
  }

  /** Fills the form with a demo account so it can be tried without typing. */
  function fillDemo(account) {
    setEmail(account.email)
    setPassword(account.password)
    setError('')
    setFieldErrors({})
  }

  return (
    <div className="auth-page">
      <div className="auth-head">
        <span className="brand-mark" aria-hidden="true">
          LM
        </span>
        <h1 className="auth-title">Leave Management System</h1>
        <p className="auth-subtitle">Sign in to view your balance and manage leave requests.</p>
      </div>

      <div className="auth-card">
        <form onSubmit={handleSubmit}>
          <Alert type="error">{error}</Alert>

          <label className="field">
            Email
            <input
              type="email"
              autoComplete="email"
              className={fieldErrors.email ? 'input-invalid' : ''}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
          </label>

          <label className="field">
            Password
            <input
              type="password"
              autoComplete="current-password"
              className={fieldErrors.password ? 'input-invalid' : ''}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
          </label>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>

      <p className="auth-footer">
        Don&apos;t have an account? <Link to="/register">Create one</Link>
      </p>

      <div className="demo-box">
        <p className="demo-title">Demo credentials</p>
        {DEMO_ACCOUNTS.map((account) => (
          <div className="demo-row" key={account.email}>
            <span className="demo-info">
              <span className="demo-role">{account.role}</span>
              <span className="demo-creds">
                {account.email} / {account.password}
              </span>
            </span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => fillDemo(account)}>
              Use
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
