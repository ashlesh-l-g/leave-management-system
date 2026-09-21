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

export default function ManagerDashboard() {
  const { auth } = useAuth()

  const [pendingLeaves, setPendingLeaves] = useState([])
  const [employees, setEmployees] = useState([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  // Remembers which row is being approved/rejected so its buttons can show progress.
  const [busy, setBusy] = useState(null)

  async function loadData() {
    try {
      const [leaveData, employeeData] = await Promise.all([api.getPendingLeaves(), api.getEmployees()])
      setPendingLeaves(leaveData)
      setEmployees(employeeData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleDecision(id, decision) {
    setError('')
    setMessage('')
    setBusy({ id, decision })
    try {
      if (decision === 'approve') {
        await api.approveLeave(id)
        setMessage('Leave request approved.')
      } else {
        await api.rejectLeave(id)
        setMessage('Leave request rejected.')
      }
      loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Manager Dashboard</h1>
          <p className="page-subtitle">Review leave requests and manage the team. Signed in as {auth.email}.</p>
        </div>
      </header>

      <Alert type="error">{error}</Alert>
      <Alert type="success">{message}</Alert>

      {loading ? (
        <Loading label="Loading pending requests…" />
      ) : (
        <>
          <section className="card card-highlight">
            <div className="card-header">
              <div>
                <h2 className="card-title">Pending leave requests</h2>
                <p className="card-subtitle">
                  {pendingLeaves.length === 0
                    ? 'Nothing needs a decision right now.'
                    : `${pendingLeaves.length} ${pendingLeaves.length === 1 ? 'request is' : 'requests are'} waiting for your decision.`}
                </p>
              </div>
              <span className="count-pill">{pendingLeaves.length}</span>
            </div>

            {pendingLeaves.length === 0 ? (
              <EmptyState
                title="You're all caught up"
                text="New requests appear here as soon as employees submit them."
              />
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Type</th>
                      <th>Dates</th>
                      <th>Days</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>
                        <span className="sr-only">Decision</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingLeaves.map((leave) => (
                      <tr key={leave.id}>
                        <td>
                          <div className="employee-cell">
                            <span className="avatar" aria-hidden="true">
                              {initials(leave.employeeName)}
                            </span>
                            <span className="cell-strong">{leave.employeeName}</span>
                          </div>
                        </td>
                        <td>{titleCase(leave.leaveType)}</td>
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
                        <td>
                          <div className="cell-actions">
                            <button
                              type="button"
                              className="btn btn-approve btn-sm"
                              onClick={() => handleDecision(leave.id, 'approve')}
                              disabled={busy?.id === leave.id}
                            >
                              {busy?.id === leave.id && busy.decision === 'approve' ? 'Approving…' : 'Approve'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-reject btn-sm"
                              onClick={() => handleDecision(leave.id, 'reject')}
                              disabled={busy?.id === leave.id}
                            >
                              {busy?.id === leave.id && busy.decision === 'reject' ? 'Rejecting…' : 'Reject'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Employees</h2>
                <p className="card-subtitle">Everyone registered in the system.</p>
              </div>
              <span className="count-pill">{employees.length}</span>
            </div>

            {employees.length === 0 ? (
              <EmptyState title="No employees yet" text="Registered employees will appear here." />
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Email</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee) => (
                      <tr key={employee.id}>
                        <td>
                          <div className="employee-cell">
                            <span className="avatar" aria-hidden="true">
                              {initials(employee.name)}
                            </span>
                            <span className="cell-strong">{employee.name}</span>
                          </div>
                        </td>
                        <td className="cell-muted">{employee.email}</td>
                        <td>
                          <RoleBadge role={employee.role} />
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
