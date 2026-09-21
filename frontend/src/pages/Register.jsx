import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/AuthContext.jsx'
import { Alert } from '../components/ui.jsx'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setFieldErrors({})
    setLoading(true)
    try {
      // Registration always creates an EMPLOYEE; the manager account comes
      // from DataInitializer on the backend.
      await register(name, email, password)
      navigate('/employee')
    } catch (err) {
      setError(err.message)
      setFieldErrors(err.fieldErrors || {})
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-head">
        <span className="brand-mark" aria-hidden="true">
          LM
        </span>
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">New accounts are created with the employee role.</p>
      </div>

      <div className="auth-card">
        <form onSubmit={handleSubmit}>
          <Alert type="error">{error}</Alert>

          <label className="field">
            Full name
            <input
              type="text"
              autoComplete="name"
              className={fieldErrors.name ? 'input-invalid' : ''}
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
            {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
          </label>

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
              autoComplete="new-password"
              className={fieldErrors.password ? 'input-invalid' : ''}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              required
            />
            {fieldErrors.password ? (
              <span className="field-error">{fieldErrors.password}</span>
            ) : (
              <span className="field-hint">At least 6 characters.</span>
            )}
          </label>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      </div>

      <p className="auth-footer">
        Already registered? <Link to="/login">Sign in</Link>
      </p>
    </div>
  )
}
