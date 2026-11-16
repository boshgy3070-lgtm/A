import express from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import type {
  ClassroomName,
  ClassroomState,
  RubricGrade,
  StudentRecord,
} from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'classroom-state.json');

const VALID_CLASSROOMS: ClassroomName[] = ['3م / أ', '3م / ب', '3م / ج'];

const DEFAULT_LESSON_SECONDS = 40 * 60;

function createEmptyState(): ClassroomState {
  return {
    students: [],
    classRatings: [],
    randomPicks: [],
    lessonTimer: {
      durationSeconds: DEFAULT_LESSON_SECONDS,
      remainingSeconds: DEFAULT_LESSON_SECONDS,
      isRunning: false,
    },
  };
}

function loadState(): ClassroomState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STATE_FILE)) {
      const initial = createEmptyState();
      fs.writeFileSync(STATE_FILE, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<ClassroomState>;
    return {
      students: Array.isArray(parsed.students) ? parsed.students : [],
      classRatings: Array.isArray(parsed.classRatings) ? parsed.classRatings : [],
      randomPicks: Array.isArray(parsed.randomPicks) ? parsed.randomPicks : [],
      lessonTimer: parsed.lessonTimer ?? {
        durationSeconds: DEFAULT_LESSON_SECONDS,
        remainingSeconds: DEFAULT_LESSON_SECONDS,
        isRunning: false,
      },
      activeTeacher: parsed.activeTeacher,
    };
  } catch {
    return createEmptyState();
  }
}

let state: ClassroomState = loadState();

function saveState() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to persist classroom state:', err);
  }
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  function broadcastState() {
    const payload = JSON.stringify({ type: 'state:sync', state });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }

  wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ type: 'state:sync', state }));
  });

  app.get('/api/state', (_req, res) => {
    res.json({ state });
  });

  app.post('/api/student/join', (req, res) => {
    const rawName = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const classroom = req.body?.classroom as ClassroomName;

    if (!rawName || rawName.length < 2) {
      res.status(400).json({ error: 'يرجى إدخال اسم الطالبة بشكل صحيح.' });
      return;
    }
    if (!VALID_CLASSROOMS.includes(classroom)) {
      res.status(400).json({ error: 'يرجى اختيار الفصل الدراسي من القائمة.' });
      return;
    }

    const normalized = rawName.replace(/\s+/g, ' ').trim();
    const now = new Date().toISOString();

    let student = state.students.find(
      (s) => s.name === normalized && s.classroom === classroom
    );

    if (!student) {
      student = {
        id: makeId('stu'),
        name: normalized,
        classroom,
        joinedAt: now,
        lastActiveAt: now,
        rulesAccepted: false,
        videoWatched: false,
        completedStations: [],
        formativeAnswers: {},
        teacherReactions: [],
      };
      state.students.push(student);
    } else {
      student.lastActiveAt = now;
    }

    saveState();
    broadcastState();
    res.json({ student, state });
  });

  app.post('/api/student/update', (req, res) => {
    const studentId = typeof req.body?.studentId === 'string' ? req.body.studentId : '';
    const patch = req.body?.patch as Partial<StudentRecord> | undefined;

    if (!studentId || !patch) {
      res.status(400).json({ error: 'بيانات التحديث غير مكتملة.' });
      return;
    }

    const idx = state.students.findIndex((s) => s.id === studentId);
    if (idx === -1) {
      res.status(404).json({ error: 'لم يتم العثور على سجل الطالبة.' });
      return;
    }

    const existing = state.students[idx];
    const now = new Date().toISOString();

    const mergedStations = Array.isArray(patch.completedStations)
      ? Array.from(new Set([...existing.completedStations, ...patch.completedStations]))
      : existing.completedStations;

    const mergedFormative = patch.formativeAnswers
      ? { ...existing.formativeAnswers, ...patch.formativeAnswers }
      : existing.formativeAnswers;

    const updated: StudentRecord = {
      ...existing,
      ...patch,
      id: existing.id,
      name: existing.name,
      classroom: existing.classroom,
      joinedAt: existing.joinedAt,
      teacherReactions: existing.teacherReactions,
      completedStations: mergedStations,
      formativeAnswers: mergedFormative,
      lastActiveAt: now,
    };

    state.students[idx] = updated;
    saveState();
    broadcastState();
    res.json({ student: updated, state });
  });

  app.post('/api/teacher/join', (req, res) => {
    const rawName = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const classroom = req.body?.classroom as ClassroomName | 'الكل';

    if (!rawName || rawName.length < 2) {
      res.status(400).json({ error: 'يرجى إدخال اسم المعلمة.' });
      return;
    }
    if (classroom !== 'الكل' && !VALID_CLASSROOMS.includes(classroom)) {
      res.status(400).json({ error: 'يرجى اختيار الفصل الدراسي.' });
      return;
    }

    state.activeTeacher = {
      name: rawName,
      classroom,
      activeAt: new Date().toISOString(),
    };
    saveState();
    broadcastState();
    res.json({ activeTeacher: state.activeTeacher, state });
  });

  app.post('/api/teacher/react-student', (req, res) => {
    const studentId = typeof req.body?.studentId === 'string' ? req.body.studentId : '';
    const emoji = typeof req.body?.emoji === 'string' ? req.body.emoji : '🌟';
    const label = typeof req.body?.label === 'string' ? req.body.label : 'تفاعل متميز';
    const teacherName =
      typeof req.body?.teacherName === 'string' && req.body.teacherName.trim()
        ? req.body.teacherName.trim()
        : 'أ. أسماء قيسي';

    const student = state.students.find((s) => s.id === studentId);
    if (!student) {
      res.status(404).json({ error: 'لم يتم العثور على الطالبة.' });
      return;
    }

    student.teacherReactions.unshift({
      id: makeId('react'),
      emoji,
      label,
      byTeacher: teacherName,
      createdAt: new Date().toISOString(),
    });

    saveState();
    broadcastState();
    res.json({ student, state });
  });

  app.post('/api/teacher/rate-class', (req, res) => {
    const classroom = req.body?.classroom as ClassroomName | 'الكل';
    const emoji = typeof req.body?.emoji === 'string' ? req.body.emoji : '🌟';
    const label = typeof req.body?.label === 'string' ? req.body.label : 'حصة متميزة';
    const note = typeof req.body?.note === 'string' ? req.body.note.trim() : '';
    const teacherName =
      typeof req.body?.teacherName === 'string' && req.body.teacherName.trim()
        ? req.body.teacherName.trim()
        : 'أ. أسماء قيسي';

    state.classRatings.unshift({
      id: makeId('rate'),
      classroom: classroom || 'الكل',
      emoji,
      label,
      note: note || undefined,
      teacherName,
      createdAt: new Date().toISOString(),
    });
    if (state.classRatings.length > 40) {
      state.classRatings = state.classRatings.slice(0, 40);
    }

    saveState();
    broadcastState();
    res.json({ state });
  });

  app.post('/api/teacher/random-pick', (req, res) => {
    const studentId = typeof req.body?.studentId === 'string' ? req.body.studentId : '';
    const studentName = typeof req.body?.studentName === 'string' ? req.body.studentName : '';
    const classroom = req.body?.classroom as ClassroomName;
    const teacherName =
      typeof req.body?.teacherName === 'string' && req.body.teacherName.trim()
        ? req.body.teacherName.trim()
        : 'أ. أسماء قيسي';

    if (!studentId || !studentName || !VALID_CLASSROOMS.includes(classroom)) {
      res.status(400).json({ error: 'بيانات الاختيار العشوائي غير صالحة.' });
      return;
    }

    const pick = {
      id: makeId('pick'),
      studentId,
      studentName,
      classroom,
      teacherName,
      createdAt: new Date().toISOString(),
    };

    state.randomPicks.unshift(pick);
    if (state.randomPicks.length > 25) {
      state.randomPicks = state.randomPicks.slice(0, 25);
    }

    saveState();
    broadcastState();
    res.json({ pick, state });
  });

  app.post('/api/teacher/grade-task', (req, res) => {
    const studentId = typeof req.body?.studentId === 'string' ? req.body.studentId : '';
    const teacherGrade = req.body?.teacherGrade as RubricGrade;

    const student = state.students.find((s) => s.id === studentId);
    if (!student || !student.performanceTask) {
      res.status(404).json({ error: 'لم تسلم الطالبة المهمة الأدائية بعد.' });
      return;
    }

    student.performanceTask.teacherGrade = teacherGrade;
    saveState();
    broadcastState();
    res.json({ student, state });
  });

  app.post('/api/teacher/add-roster', (req, res) => {
    const classroom = req.body?.classroom as ClassroomName;
    const names = Array.isArray(req.body?.names) ? req.body.names : [];

    if (!VALID_CLASSROOMS.includes(classroom)) {
      res.status(400).json({ error: 'يرجى اختيار الفصل الدراسي.' });
      return;
    }

    const now = new Date().toISOString();
    let added = 0;

    for (const raw of names) {
      if (typeof raw !== 'string') continue;
      const clean = raw.replace(/\s+/g, ' ').trim();
      if (clean.length < 2) continue;
      const exists = state.students.some(
        (s) => s.name === clean && s.classroom === classroom
      );
      if (!exists) {
        state.students.push({
          id: makeId('stu'),
          name: clean,
          classroom,
          joinedAt: now,
          lastActiveAt: now,
          rulesAccepted: false,
          videoWatched: false,
          completedStations: [],
          formativeAnswers: {},
          teacherReactions: [],
        });
        added++;
      }
    }

    saveState();
    broadcastState();
    res.json({ added, state });
  });

  app.post('/api/timer/control', (req, res) => {
    const action = req.body?.action as 'start' | 'pause' | 'reset' | 'adjust';
    const deltaSeconds = typeof req.body?.deltaSeconds === 'number' ? req.body.deltaSeconds : 0;

    const current = state.lessonTimer;
    const now = Date.now();
    const computedRemaining =
      current.isRunning && current.startedAt
        ? Math.max(0, Math.round(current.remainingSeconds - (now - current.startedAt) / 1000))
        : current.remainingSeconds;

    if (action === 'start') {
      const nextRemaining = computedRemaining <= 0 ? current.durationSeconds : computedRemaining;
      state.lessonTimer = {
        ...current,
        remainingSeconds: nextRemaining,
        isRunning: true,
        startedAt: now,
      };
    } else if (action === 'pause') {
      state.lessonTimer = {
        ...current,
        remainingSeconds: computedRemaining,
        isRunning: false,
        startedAt: undefined,
      };
    } else if (action === 'reset') {
      state.lessonTimer = {
        durationSeconds: DEFAULT_LESSON_SECONDS,
        remainingSeconds: DEFAULT_LESSON_SECONDS,
        isRunning: false,
        startedAt: undefined,
      };
    } else if (action === 'adjust') {
      const adjusted = Math.min(3600, Math.max(0, computedRemaining + deltaSeconds));
      state.lessonTimer = {
        ...current,
        remainingSeconds: adjusted,
        startedAt: current.isRunning ? now : undefined,
      };
    } else {
      res.status(400).json({ error: 'إجراء المؤقت غير صالح.' });
      return;
    }

    saveState();
    broadcastState();
    res.json({ lessonTimer: state.lessonTimer, state });
  });

  app.post('/api/teacher/reset', (_req, res) => {
    state = createEmptyState();
    saveState();
    broadcastState();
    res.json({ state });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const PORT = 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
