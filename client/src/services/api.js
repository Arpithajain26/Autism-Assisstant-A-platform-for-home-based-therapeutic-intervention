const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const req = async (method, path, body) => {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  const token = localStorage.getItem('auth_token');
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  const cleanBase = BASE.endsWith('/') ? BASE.slice(0, -1) : BASE;
  const res = await fetch(`${cleanBase}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};

// ── Auth ─────────────────────────────────────────────────────────────────────
export const registerUser = (payload) => req('POST', '/api/auth/register', payload);
export const loginUser = (email, password) => req('POST', '/api/auth/login', { email, password });
export const getMe = () => req('GET', '/api/auth/me');

// Sync a Firebase-authenticated user with the backend and get a JWT token
export const firebaseSync = (payload) => req('POST', '/api/auth/firebase-sync', payload);

// Google login helper (also syncs with backend)
export const googleLogin = (email, name, role = 'parent') =>
  req('POST', '/api/auth/firebase-sync', { email, name, role });

// ── Assessment ────────────────────────────────────────────────────────────────
export const getAssessmentQuestions = () => req('GET', '/api/assessment/questions');
export const submitAssessment = (childId, answers) =>
  req('POST', '/api/assessment/submit', { childId, answers });

// ── Activities ────────────────────────────────────────────────────────────────
export const getActivities = (level) =>
  req('GET', `/api/activities${level ? `?level=${level}` : ''}`).catch(() => []);

export const getRecommendations = (level, focusArea = '') => {
  const params = new URLSearchParams();
  if (level) params.set('level', level);
  if (focusArea.trim()) params.set('focusArea', focusArea.trim());
  return req('GET', `/api/activities/recommendations?${params}`).catch(() => ({ recommended_activities: [] }));
};

export const getActivityById = (id) => req('GET', `/api/activities/${id}`);

// ── Children Management ────────────────────────────────────────────────────────
export const getChildren = (userId) => req('GET', `/api/children/${userId}`).catch(() => []);

export const createChild = (childData) => req('POST', '/api/children/create', childData);

export const deleteChild = (childId) => req('DELETE', `/api/children/${childId}`);

export const generateLinkCode = (childId) =>
  req('POST', '/api/children/generate-link-code', { childId });

export const linkByCode = (parentId, code) =>
  req('POST', '/api/children/link-by-code', { parentId, code });

export const assignTask = (childId, activityId) =>
  req('POST', '/api/children/assign-task', { childId, activityId });

export const completeTask = (childId, activityId) =>
  req('POST', '/api/children/complete-task', { childId, activityId });

export const getChildTasks = (childId) =>
  req('GET', `/api/child/${childId}/tasks`).catch(() => ({
    assigned: [],
    completed: [],
    level: null,
    assessmentDone: false,
  }));
