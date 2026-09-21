import { getToken } from './auth/authStorage.js'

// The Vite dev server proxies /api to http://localhost:8080 (see vite.config.js).
const BASE_URL = '/api'

/**
 * One small wrapper around fetch():
 * - adds the JSON content type when there is a body
 * - adds the JWT to every request when the user is logged in
 * - throws an Error with the backend's message when the status is not 2xx
 */
async function request(path, { method = 'GET', body } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const data = response.status === 204 ? null : await response.json().catch(() => null)

  if (!response.ok) {
    // Our own handlers send { message }, Spring Security/Boot sends { error }.
    const error = new Error(data?.message || data?.error || `Request failed with status ${response.status}`)
    // Bean Validation failures (400) also carry { errors: { field: message } },
    // which the forms use to highlight the offending input.
    error.fieldErrors = data?.errors || null
    throw error
  }
  return data
}

export const api = {
  // Authentication
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),

  // Employee
  getProfile: () => request('/employees/me'),
  getMyBalances: () => request('/employees/me/balances'),
  getMyLeaves: () => request('/leaves'),
  applyLeave: (body) => request('/leaves', { method: 'POST', body }),
  cancelLeave: (id) => request(`/leaves/${id}/cancel`, { method: 'PATCH' }),

  // Manager
  getPendingLeaves: () => request('/manager/leaves/pending'),
  approveLeave: (id) => request(`/manager/leaves/${id}/approve`, { method: 'PATCH' }),
  rejectLeave: (id) => request(`/manager/leaves/${id}/reject`, { method: 'PATCH' }),
  getEmployees: () => request('/manager/employees'),
}
