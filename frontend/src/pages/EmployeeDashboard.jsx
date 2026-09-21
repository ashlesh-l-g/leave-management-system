import { useEffect, useState } from 'react'

import { api } from '../api.js'
import { useAuth } from '../auth/AuthContext.jsx'
import {
  Alert,
  EmptyState,
  Loading,
  RoleBadge,
  StatusBadge,
  formatDate,
  initials,
  titleCase,
} from '../components/ui.jsx'

const LEAVE_TYPES = ['CASUAL', 'SICK', 'EARNED']

const EMPTY_FORM = { leaveType: 'CASUAL', startDate: '', endDate: '', reason: '' }

export default function EmployeeDashboard() {
  const { auth } = useAuth()

  const [profile, setProfile] = useState(null)
  const [balances, setBalances] = useState([])
  const [leaves, setLeaves] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [cancellingId, setCancellingId] = useState(null)

  /** Re-reads everything the page shows. Called on mount and after each action. */
  async function loadData() {
    try {
      const [profileData, balanceData, leaveData] = await Promise.all([
        api.getProfile(),
        api.getMyBalances(),
        api.getMyLeaves(),
      ])
      setProfile(profileData)
      setBalances(balanceData)
      setLeaves(leaveData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // useEffect with an empty dependency array runs once, after the first render.
  useEffect(() => {
    loadData()
  }, [])

  async function handleApply(event) {
    event.preventDefault()
    setError('')
    setFieldErrors({})
    setMessage('')
    setApplying(true)
    try {
      await api.applyLeave(form)
      setMessage('Leave request submitted.')
      setForm(EMPTY_FORM)
      loadData()
    } catch (err) {
      setError(err.message)
      setFieldErrors(err.fieldErrors || {})
    } finally {
      setApplying(false)
    }
  }

  async function handleCancel(id) {
    setError('')
    setMessage('')
    setCancellingId(id)
    try {
      await api.cancelLeave(id)
      setMessage('Leave request cancelled.')
      loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Employee Dashboard</h1>
          <p className="page-subtitle">
            {profile ? `Welcome back, ${profile.name}. Here is your leave overview.` : 'Your leave overview.'}
          </p>
        </div>
      </header>

      <Alert type="error">{error}</Alert>
      <Alert type="success">{message}</Alert>

      {loading ? (
        <Loading label="Loading your dashboard…" />
      ) : (
        <>
          {balances.length === 0 ? (
            <EmptyState title="No leave balance yet" text="Your leave balance will appear here once it is assigned." />
          ) : (
            <section className="stat-grid" aria-label="Leave balance">
              {balances.map((balance) => {
                const usedPercent =
                  balance.totalDays > 0 ? Math.round((balance.usedDays / balance.totalDays) * 100) : 0
                return (
                  <article className="stat" key={balance.leaveType}>
                    <p className="stat-label">{titleCase(balance.leaveType)} leave</p>
                    <p className="stat-value">
                      {balance.remainingDays}
                      <span className="stat-unit">days left</span>
                    </p>
                    <div className="stat-bar">
                      <div className="stat-bar-fill" style={{ width: `${usedPercent}%` }} />
                    </div>
                    <p className="stat-meta">
                      {balance.usedDays} used of {balance.totalDays} total
                    </p>
                  </article>
                )
              })}
            </section>
          )}

          <div className="grid grid-2">
            <section className="card">
              <div className="card-header">
                <div>
                  <h2 className="card-title">Apply for leave</h2>
                  <p className="card-subtitle">Submit a request and a manager will review it.</p>
                </div>
              </div>

              <form onSubmit={handleApply}>
                <label className="field">
                  Leave type
                  <select
                    value={form.leaveType}
                    onChange={(event) => setForm({ ...form, leaveType: event.target.value })}
                  >
                    {LEAVE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {titleCase(type)}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="form-grid">
                  <label className="field">
                    Start date
                    <input
                      type="date"
                      className={fieldErrors.startDate ? 'input-invalid' : ''}
                      value={form.startDate}
                      onChange={(event) => setForm({ ...form, startDate: event.target.value })}
                      required
                    />
                    {fieldErrors.startDate && <span className="field-error">{fieldErrors.startDate}</span>}
                  </label>

                  <label className="field">
                    End date
                    <input
                      type="date"
                      className={fieldErrors.endDate ? 'input-invalid' : ''}
                      value={form.endDate}
                      onChange={(event) => setForm({ ...form, endDate: event.target.value })}
                      required
                    />
                    {fieldErrors.endDate && <span className="field-error">{fieldErrors.endDate}</span>}
                  </label>
                </div>

                <label className="field">
                  Reason
                  <textarea
                    rows={3}
                    maxLength={500}
                    className={fieldErrors.reason ? 'input-invalid' : ''}
                    value={form.reason}
                    onChange={(event) => setForm({ ...form, reason: event.target.value })}
                    required
                  />
                  {fieldErrors.reason ? (
                    <span className="field-error">{fieldErrors.reason}</span>
                  ) : (
                    <span className="field-hint">Both dates count, so 5 Oct to 7 Oct is 3 days.</span>
                  )}
                </label>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={applying}>
                    {applying ? 'Submitting…' : 'Submit request'}
                  </button>
                </div>
              </form>
            </section>

            <section className="card">
              <div className="card-header">
                <h2 className="card-title">My profile</h2>
              </div>

              {profile ? (
                <>
                  <div className="profile">
                    <span className="profile-avatar" aria-hidden="true">
                      {initials(profile.name)}
                    </span>
                    <div>
                      <p className="profile-name">{profile.name}</p>
                      <p className="profile-email">{profile.email}</p>
                    </div>
                  </div>

                  <dl className="detail-list">
                    <div className="detail">
                      <dt className="detail-label">Role</dt>
                      <dd className="detail-value">
                        <RoleBadge role={profile.role} />
                      </dd>
                    </div>
                    <div className="detail">
                      <dt className="detail-label">Leave types</dt>
                      <dd className="detail-value">{balances.length}</dd>
                    </div>
                    <div className="detail">
                      <dt className="detail-label">Requests</dt>
                      <dd className="detail-value">{leaves.length}</dd>
                    </div>
                  </dl>

                  <p className="hint card-note">Signed in as {auth.email}</p>
                </>
              ) : (
                <EmptyState title="Profile unavailable" text="Reload the page to try again." />
              )}
            </section>
          </div>

          <section className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">My leave requests</h2>
                <p className="card-subtitle">
                  {leaves.length} {leaves.length === 1 ? 'request' : 'requests'} in total
                </p>
              </div>
            </div>

            {leaves.length === 0 ? (
              <EmptyState title="No leave requests yet" text="Submit your first request with the form above." />
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Dates</th>
                      <th>Days</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Applied</th>
                      <th>
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.map((leave) => (
                      <tr key={leave.id}>
                        <td className="cell-strong">{titleCase(leave.leaveType)}</td>
                        <td className="cell-muted">
                          {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                        </td>
                        <td>{leave.days}</td>
                        <td className="cell-reason" title={leave.reason}>
                          {leave.reason}
                        </td>
                        <td>
                          <StatusBadge status={leave.status} />
                        </td>
                        <td className="cell-muted">{formatDate(leave.appliedAt)}</td>
                        <td>
                          <div className="cell-actions">
                            {leave.status === 'PENDING' && (
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleCancel(leave.id)}
                                disabled={cancellingId === leave.id}
                              >
                                {cancellingId === leave.id ? 'Cancelling…' : 'Cancel'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
