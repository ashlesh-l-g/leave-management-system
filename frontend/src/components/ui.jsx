/**
 * Small presentational helpers shared by the dashboards.
 *
 * They are plain functions that return JSX, so they are easy to read: no state,
 * no API calls, only markup and CSS classes.
 */

/** "PENDING" -> "Pending". Used for enum values that come from the backend. */
export function titleCase(value) {
  if (!value) return ''
  return value.charAt(0) + value.slice(1).toLowerCase()
}

/** "Evan Employee" -> "EE". Shown inside the little avatar circles. */
export function initials(name) {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

/**
 * "2026-10-05" or "2026-09-21T23:45:00" -> "05 Oct 2026".
 * The first 10 characters are always YYYY-MM-DD, so no timezone surprises.
 */
export function formatDate(value) {
  if (!value) return '-'
  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number)
  const date = new Date(year, month - 1, day)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Coloured pill for PENDING / APPROVED / REJECTED / CANCELLED. */
export function StatusBadge({ status }) {
  return <span className={`badge badge-${status.toLowerCase()}`}>{titleCase(status)}</span>
}

/** Coloured pill for the EMPLOYEE / MANAGER role. */
export function RoleBadge({ role }) {
  return <span className={`badge badge-${role.toLowerCase()}`}>{titleCase(role)}</span>
}

/** Message box. Renders nothing when there is no message to show. */
export function Alert({ type = 'error', children }) {
  if (!children) return null
  return (
    <div className={`alert alert-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <span className="alert-icon" aria-hidden="true">
        {type === 'error' ? '!' : '✓'}
      </span>
      <p className="alert-text">{children}</p>
    </div>
  )
}

/** Shown while the first API calls are still running. */
export function Loading({ label = 'Loading…' }) {
  return (
    <p className="loading" aria-busy="true">
      <span className="spinner" aria-hidden="true" />
      {label}
    </p>
  )
}

/** Friendly placeholder for an empty table or list. */
export function EmptyState({ title, text }) {
  return (
    <div className="empty">
      <p className="empty-title">{title}</p>
      {text && <p className="empty-text">{text}</p>}
    </div>
  )
}
