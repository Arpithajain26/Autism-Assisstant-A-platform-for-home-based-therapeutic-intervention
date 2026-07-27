const express = require('express');
const cors = require('cors');
const { activities, users, assessmentQuestions, getNextId } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors()); // Simplest permissive CORS for hackathon
app.use(express.json());

// ── Helpers ───────────────────────────────────────────────────────────────────
const findUser = (id) => users.find((u) => u._id === id);
const makeToken = (userId) => Buffer.from(`${userId}:${Date.now()}`).toString('base64');
const userIdFromToken = (token) => {
  try { return Buffer.from(token, 'base64').toString().split(':')[0]; }
  catch { return null; }
};
const safeUser = (u) => {
  const { password, ...rest } = u;
  return rest;
};

// Compute level from assessment score (out of 24 max)
const computeLevel = (answers) => {
  const total = answers.reduce((sum, a) => sum + a, 0);
  if (total <= 10) return 1;   // Beginner
  if (total <= 18) return 2;   // Intermediate
  return 3;                    // Advanced
};

// Auto-assign top 3 tasks for a level
const autoAssignTasks = (level) =>
  activities.filter((a) => a.level === level).slice(0, 3).map((a) => a._id);

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/', (_req, res) => res.json({ status: 'ok', message: '🚀 Autism Assistant API running' }));

// ═════════════════════════════════════════════════════════════════════════════
// AUTH
// ═════════════════════════════════════════════════════════════════════════════

// POST /api/auth/register
app.post('/api/auth/register', (req, res) => {
  const { role, name, email, password, age, parentEmail, specialization } = req.body;

  if (!role || !name || !email || !password) {
    return res.status(400).json({ error: 'role, name, email and password are required.' });
  }
  if (!['parent', 'child', 'therapist'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role.' });
  }
  if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: 'Email already registered.' });
  }

  const _id = getNextId();
  const newUser = { _id, role, name, email, password };

  if (role === 'parent') {
    newUser.children = [];
  }
  if (role === 'therapist') {
    newUser.specialization = specialization || 'General';
    newUser.assignedChildren = [];
  }
  if (role === 'child') {
    newUser.age = parseInt(age) || 6;
    newUser.level = null;           // set after assessment
    newUser.assessmentDone = false;
    newUser.assignedTasks = [];
    newUser.completedTasks = [];
    newUser.parentId = null;

    // Link to parent if parentEmail provided
    if (parentEmail) {
      const parent = users.find((u) => u.email.toLowerCase() === parentEmail.toLowerCase() && u.role === 'parent');
      if (parent) {
        newUser.parentId = parent._id;
        parent.children = [...(parent.children || []), _id];
      }
    }
  }

  users.push(newUser);
  const token = makeToken(_id);
  res.status(201).json({ token, user: safeUser(newUser) });
});

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });

  const user = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );
  if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

  res.json({ token: makeToken(user._id), user: safeUser(user) });
});

// GET /api/auth/me  (token check)
app.get('/api/auth/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const uid = userIdFromToken(token);
  const user = uid && findUser(uid);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ user: safeUser(user) });
});

// ═════════════════════════════════════════════════════════════════════════════
// ASSESSMENT
// ═════════════════════════════════════════════════════════════════════════════

// GET /api/assessment/questions
app.get('/api/assessment/questions', (_req, res) => {
  res.json(assessmentQuestions);
});

// POST /api/assessment/submit  { childId, answers: [score, score, ...] }
app.post('/api/assessment/submit', (req, res) => {
  const { childId, answers } = req.body;
  if (!childId || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'childId and answers array required.' });
  }

  const child = findUser(childId);
  if (!child || child.role !== 'child') {
    return res.status(404).json({ error: 'Child not found.' });
  }

  const level = computeLevel(answers);
  child.level = level;
  child.assessmentDone = true;
  child.assignedTasks = autoAssignTasks(level);

  res.json({
    level,
    levelLabel: ['', 'Beginner', 'Intermediate', 'Advanced'][level],
    assignedTasks: child.assignedTasks,
    message: `Level ${level} identified! Tasks have been assigned.`,
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// ACTIVITIES
// ═════════════════════════════════════════════════════════════════════════════

// GET /api/activities?level=1
app.get('/api/activities', (req, res) => {
  const { level } = req.query;
  let result = activities;
  if (level) result = activities.filter((a) => a.level === parseInt(level));
  res.json(result);
});

// GET /api/activities/recommendations?level=2&focusArea=speech
app.get('/api/activities/recommendations', (req, res) => {
  const { level, focusArea } = req.query;
  let result = activities;

  if (level) result = result.filter((a) => a.level === parseInt(level));

  if (focusArea && focusArea.trim()) {
    const kw = focusArea.trim().toLowerCase();
    const filtered = result.filter(
      (a) =>
        a.focusAreas.some((f) => f.includes(kw)) ||
        a.title.toLowerCase().includes(kw) ||
        a.category.toLowerCase().includes(kw) ||
        a.description.toLowerCase().includes(kw)
    );
    result = filtered.length > 0 ? filtered : result.slice(0, 3);
  } else {
    result = [...result].sort(() => Math.random() - 0.5).slice(0, 4);
  }

  res.json({ recommended_activities: result.slice(0, 6) });
});

// GET /api/activities/:id
app.get('/api/activities/:id', (req, res) => {
  const act = activities.find((a) => a._id === req.params.id);
  if (!act) return res.status(404).json({ error: 'Activity not found.' });
  res.json(act);
});

// ═════════════════════════════════════════════════════════════════════════════
// CHILDREN / TASKS (Parent & Therapist)
// ═════════════════════════════════════════════════════════════════════════════

// GET /api/children/:parentOrTherapistId
app.get('/api/children/:userId', (req, res) => {
  const user = findUser(req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  let childIds = [];
  if (user.role === 'parent') childIds = user.children || [];
  if (user.role === 'therapist') childIds = user.assignedChildren || [];

  const children = childIds
    .map((id) => findUser(id))
    .filter(Boolean)
    .map((c) => ({
      ...safeUser(c),
      assignedActivities: (c.assignedTasks || []).map((tid) => activities.find((a) => a._id === tid)).filter(Boolean),
      completedActivities: (c.completedTasks || []).map((tid) => activities.find((a) => a._id === tid)).filter(Boolean),
    }));

  res.json(children);
});

// POST /api/children/assign-task  { childId, activityId }
app.post('/api/children/assign-task', (req, res) => {
  const { childId, activityId } = req.body;
  const child = findUser(childId);
  if (!child || child.role !== 'child') return res.status(404).json({ error: 'Child not found.' });

  if (!child.assignedTasks.includes(activityId)) {
    child.assignedTasks.push(activityId);
  }
  res.json({ success: true, assignedTasks: child.assignedTasks });
});

// POST /api/children/complete-task  { childId, activityId }
app.post('/api/children/complete-task', (req, res) => {
  const { childId, activityId } = req.body;
  const child = findUser(childId);
  if (!child || child.role !== 'child') return res.status(404).json({ error: 'Child not found.' });

  child.assignedTasks = child.assignedTasks.filter((id) => id !== activityId);
  if (!child.completedTasks.includes(activityId)) {
    child.completedTasks.push(activityId);
  }
  res.json({ success: true, completedTasks: child.completedTasks });
});

// GET /api/child/:childId/tasks  — child's own task list
app.get('/api/child/:childId/tasks', (req, res) => {
  const child = findUser(req.params.childId);
  if (!child || child.role !== 'child') return res.status(404).json({ error: 'Not found.' });

  const assigned = (child.assignedTasks || []).map((id) => activities.find((a) => a._id === id)).filter(Boolean);
  const completed = (child.completedTasks || []).map((id) => activities.find((a) => a._id === id)).filter(Boolean);

  res.json({ level: child.level, assessmentDone: child.assessmentDone, assigned, completed });
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: `${req.method} ${req.url} not found` }));

app.listen(PORT, () => {
  console.log(`✅  Server → http://localhost:${PORT}`);
  console.log(`   POST /api/auth/register | /api/auth/login`);
  console.log(`   GET  /api/assessment/questions`);
  console.log(`   POST /api/assessment/submit`);
  console.log(`   GET  /api/activities?level=1`);
  console.log(`   GET  /api/children/:userId`);
  console.log(`   GET  /api/child/:childId/tasks`);
});
