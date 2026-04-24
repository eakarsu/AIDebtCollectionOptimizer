const API_BASE = '/api';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function api(path, method = 'GET', body = null) {
  const opts = { method, headers: getHeaders() };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, opts);
  return res.json();
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function getDefaults() {
  const res = await fetch(`${API_BASE}/auth/defaults`);
  return res.json();
}

export async function fetchItems(endpoint, search = '') {
  const url = search ? `${API_BASE}/${endpoint}?search=${encodeURIComponent(search)}` : `${API_BASE}/${endpoint}`;
  const res = await fetch(url, { headers: getHeaders() });
  return res.json();
}

export async function fetchItem(endpoint, id) {
  const res = await fetch(`${API_BASE}/${endpoint}/${id}`, { headers: getHeaders() });
  return res.json();
}

export async function createItem(endpoint, data) {
  const res = await fetch(`${API_BASE}/${endpoint}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateItem(endpoint, id, data) {
  const res = await fetch(`${API_BASE}/${endpoint}/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteItem(endpoint, id) {
  const res = await fetch(`${API_BASE}/${endpoint}/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return res.json();
}

export async function aiAnalyze(prompt, context, feature) {
  const res = await fetch(`${API_BASE}/ai/analyze`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ prompt, context, feature }),
  });
  return res.json();
}

// Dashboard
export const fetchDashboardStats = () => api('/dashboard/stats');
export const fetchDashboardTrends = () => api('/dashboard/trends');
export const fetchRecentActivity = () => api('/dashboard/recent-activity');

// Export
export const exportCSV = (entity, filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  window.open(`${API_BASE}/export/${entity}?${params}`, '_blank');
};

// Debtor Profile
export const fetchDebtorProfile = (id) => api(`/debtor-profile/${id}`);
export const fetchDebtorSummary = (id) => api(`/debtor-profile/${id}/summary`);

// Bulk Operations
export const bulkUpdate = (entity, ids, updates) => api(`/bulk/${entity}/update`, 'POST', { ids, updates });
export const bulkDelete = (entity, ids) => api(`/bulk/${entity}/delete`, 'POST', { ids });

// Reports
export const fetchReport = (reportType) => api(`/reports/${reportType}`);

// Settlement Calculator
export const calculateSettlement = (data) => api('/settlement-calc/calculate', 'POST', data);

// Notifications
export const fetchNotifications = () => api('/notifications');
export const markNotificationRead = (id) => api(`/notifications/${id}/read`, 'PUT');
export const markAllNotificationsRead = () => api('/notifications/read-all', 'PUT');
export const fetchUnreadCount = () => api('/notifications/unread-count');

// Users
export const registerUser = (data) => api('/users/register', 'POST', data);
export const changePassword = (data) => api('/users/change-password', 'PUT', data);
export const updateProfile = (data) => api('/users/profile', 'PUT', data);

// Audit
export const fetchAuditLogs = (params) => {
  const query = new URLSearchParams(params).toString();
  return api(`/audit?${query}`);
};
