import { useCallback, useEffect, useMemo, useState } from 'react';
import { AssessmentsSection } from './components/AssessmentsSection';
import { EntryGate } from './components/EntryGate';
import { LearningStations } from './components/LearningStations';
import { LessonTimerBar } from './components/LessonTimerBar';
import { TeacherDashboard } from './components/TeacherDashboard';
import { VideoIntroSection } from './components/VideoIntroSection';
import { LESSON_META } from './data/lessonContent';
import type {
  ClassroomName,
  ClassroomState,
  RubricGrade,
  SessionIdentity,
  StudentRecord,
} from './types';

const SESSION_STORAGE_KEY = 'python_libs_lesson_session_v1';

const EMPTY_STATE: ClassroomState = {
  students: [],
  classRatings: [],
  randomPicks: [],
  lessonTimer: {
    durationSeconds: 40 * 60,
    remainingSeconds: 40 * 60,
    isRunning: false,
  },
};

export default function App() {
  const [state, setState] = useState<ClassroomState>(EMPTY_STATE);
  const [session, setSession] = useState<SessionIdentity | null>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as SessionIdentity) : null;
    } catch {
      return null;
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/state');
      if (!res.ok) return;
      const data = (await res.json()) as { state: ClassroomState };
      if (data?.state) {
        setState(data.state);
      }
    } catch {
      // Transient network error ignored; WebSocket will re-sync
    }
  }, []);

  useEffect(() => {
    fetchState();

    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let closedByUser = false;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as { type: string; state?: ClassroomState };
          if (msg.type === 'state:sync' && msg.state) {
            setState(msg.state);
          }
        } catch {
          // ignore malformed messages
        }
      };
      ws.onclose = () => {
        if (!closedByUser) {
          reconnectTimer = setTimeout(connect, 2000);
        }
      };
    };

    connect();
    return () => {
      closedByUser = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, [fetchState]);

  const handleStudentJoin = async (name: string, classroom: ClassroomName) => {
    setIsSubmitting(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/student/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, classroom }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'تعذر تسجيل الدخول.');
        return;
      }
      setState(data.state);
      const nextSession: SessionIdentity = {
        role: 'student',
        name: data.student.name,
        classroom: data.student.classroom,
        studentId: data.student.id,
      };
      setSession(nextSession);
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
    } catch {
      setAuthError('حدث خطأ في الاتصال بالخادم.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTeacherJoin = async (name: string, classroom: ClassroomName | 'الكل') => {
    setIsSubmitting(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/teacher/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, classroom }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'تعذر فتح لوحة المعلمة.');
        return;
      }
      setState(data.state);
      const nextSession: SessionIdentity = {
        role: 'teacher',
        name,
        classroom,
      };
      setSession(nextSession);
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
    } catch {
      setAuthError('حدث خطأ في الاتصال بالخادم.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setSession(null);
  };

  const currentStudent = useMemo<StudentRecord | null>(() => {
    if (!session || session.role !== 'student') return null;
    return (
      state.students.find((s) => s.id === session.studentId) ||
      state.students.find(
        (s) => s.name === session.name && s.classroom === session.classroom
      ) ||
      null
    );
  }, [session, state.students]);

  const handleUpdateStudent = useCallback(
    async (patch: Partial<StudentRecord>) => {
      if (!currentStudent) return;
      const res = await fetch('/api/student/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: currentStudent.id, patch }),
      });
      if (res.ok) {
        const data = await res.json();
        setState(data.state);
      }
    },
    [currentStudent]
  );

  const handleReactStudent = async (studentId: string, emoji: string, label: string) => {
    const res = await fetch('/api/teacher/react-student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId,
        emoji,
        label,
        teacherName: session?.name || LESSON_META.teacher,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setState(data.state);
    }
  };

  const handleRateClass = async (
    classroom: ClassroomName | 'الكل',
    emoji: string,
    label: string,
    note?: string
  ) => {
    const res = await fetch('/api/teacher/rate-class', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        classroom,
        emoji,
        label,
        note,
        teacherName: session?.name || LESSON_META.teacher,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setState(data.state);
    }
  };

  const handleRandomPick = async (student: StudentRecord) => {
    const res = await fetch('/api/teacher/random-pick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: student.id,
        studentName: student.name,
        classroom: student.classroom,
        teacherName: session?.name || LESSON_META.teacher,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setState(data.state);
    }
  };

  const handleGradeTask = async (studentId: string, teacherGrade: RubricGrade) => {
    const res = await fetch('/api/teacher/grade-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, teacherGrade }),
    });
    if (res.ok) {
      const data = await res.json();
      setState(data.state);
    }
  };

  const handleAddRoster = async (classroom: ClassroomName, names: string[]) => {
    const res = await fetch('/api/teacher/add-roster', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classroom, names }),
    });
    if (res.ok) {
      const data = await res.json();
      setState(data.state);
    }
  };

  const handleResetSession = async () => {
    const res = await fetch('/api/teacher/reset', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setState(data.state);
    }
  };

  const handleControlTimer = async (
    action: 'start' | 'pause' | 'reset' | 'adjust',
    deltaSeconds?: number
  ) => {
    const res = await fetch('/api/timer/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, deltaSeconds }),
    });
    if (res.ok) {
      const data = await res.json();
      setState(data.state);
    }
  };

  const classmates = useMemo(() => {
    if (!currentStudent) return [];
    return state.students.filter((s) => s.classroom === currentStudent.classroom);
  }, [state.students, currentStudent]);

  const latestClassRating = useMemo(() => {
    if (!currentStudent) return null;
    return (
      state.classRatings.find(
        (r) => r.classroom === 'الكل' || r.classroom === currentStudent.classroom
      ) || null
    );
  }, [state.classRatings, currentStudent]);

  const latestRandomPick = useMemo(() => {
    if (!currentStudent) return null;
    return (
      state.randomPicks.find((p) => p.classroom === currentStudent.classroom) || null
    );
  }, [state.randomPicks, currentStudent]);

  if (!session || (session.role === 'student' && !currentStudent)) {
    return (
      <div className="min-h-screen tech-grid-bg">
        <EntryGate
          onStudentJoin={handleStudentJoin}
          onTeacherJoin={handleTeacherJoin}
          isSubmitting={isSubmitting}
          error={authError}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen tech-grid-bg flex flex-col">
      {/* Top Bar Contract: 3 zones only */}
      <header className="sticky top-0 z-30 bg-[#070D19]/90 backdrop-blur-md border-b border-slate-800/80 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-8">
          <a
            href="#"
            className="text-base sm:text-lg font-bold text-white whitespace-nowrap shrink-0"
          >
            المكتبات البرمجية · بايثون
          </a>

          {session.role === 'student' ? (
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
              <a href="#intro" className="hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0">
                المقدمة
              </a>
              <a href="#stations" className="hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0">
                المحطات
              </a>
              <a href="#links" className="hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0">
                الربط
              </a>
              <a href="#task" className="hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0">
                المهمة والتقييم
              </a>
              <a href="#exit-ticket" className="hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0">
                بطاقة الخروج
              </a>
            </nav>
          ) : (
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
              <span className="whitespace-nowrap shrink-0 text-emerald-300">
                بوابة المعلمة التفاعلية
              </span>
              <span className="whitespace-nowrap shrink-0 text-slate-400">
                {session.name} · {session.classroom}
              </span>
            </nav>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            خروج
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10">
        <LessonTimerBar
          role={session.role}
          timerState={state.lessonTimer}
          onControlTimer={handleControlTimer}
        />

        {session.role === 'teacher' ? (
          <TeacherDashboard
            teacherName={session.name}
            initialClassroom={session.classroom}
            state={state}
            onReactStudent={handleReactStudent}
            onRateClass={handleRateClass}
            onRandomPick={handleRandomPick}
            onGradeTask={handleGradeTask}
            onAddRoster={handleAddRoster}
            onResetSession={handleResetSession}
          />
        ) : (
          currentStudent && (
            <>
              {/* Student Hero Banner */}
              <section className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-cyan-300 font-medium">
                      <span>{LESSON_META.subject}</span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span>{LESSON_META.unit}</span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span>{LESSON_META.pages}</span>
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-bold text-white text-balance">
                      أهلاً بكِ يا {currentStudent.name} في درس المكتبات البرمجية
                    </h1>
                    <p className="text-sm text-slate-300">
                      الفصل: <strong className="text-emerald-300">{currentStudent.classroom}</strong>{' '}
                      · {LESSON_META.attribution}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left sm:text-right">
                    <div className="text-xs text-slate-400">نسبة إنجاز المحطات</div>
                    <div className="text-2xl font-bold text-cyan-300 tabular-nums mt-0.5">
                      {Math.round((currentStudent.completedStations.length / 5) * 100)}%
                    </div>
                  </div>
                </div>

                {/* Live Teacher Feedback Strip for Student */}
                {(currentStudent.teacherReactions.length > 0 ||
                  latestClassRating ||
                  latestRandomPick) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
                    {currentStudent.teacherReactions.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs">
                        <div className="text-amber-300 font-bold mb-1">رسالة تحفيز من معلمتكِ</div>
                        <div className="text-white font-semibold flex items-center gap-2">
                          <span className="text-xl">{currentStudent.teacherReactions[0].emoji}</span>
                          <span>{currentStudent.teacherReactions[0].label}</span>
                        </div>
                      </div>
                    )}

                    {latestClassRating && (
                      <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
                        <div className="text-emerald-300 font-bold mb-1">تقييم المعلمة للحصة</div>
                        <div className="text-white font-semibold flex items-center gap-2">
                          <span className="text-xl">{latestClassRating.emoji}</span>
                          <span>{latestClassRating.label}</span>
                        </div>
                        {latestClassRating.note && (
                          <div className="text-slate-300 mt-1">{latestClassRating.note}</div>
                        )}
                      </div>
                    )}

                    {latestRandomPick && (
                      <div
                        className={`p-3.5 rounded-xl border text-xs ${
                          latestRandomPick.studentId === currentStudent.id
                            ? 'bg-cyan-500/15 border-cyan-400'
                            : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        <div className="text-cyan-300 font-bold mb-1">الاختيار العشوائي في الفصل</div>
                        <div className="text-white font-semibold">
                          {latestRandomPick.studentId === currentStudent.id
                            ? `دوركِ الآن للمشاركة يا ${currentStudent.name}!`
                            : `تم اختيار الطالبة: ${latestRandomPick.studentName}`}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>

              <VideoIntroSection
                rulesAccepted={currentStudent.rulesAccepted}
                videoWatched={currentStudent.videoWatched}
                onAcceptRules={() => handleUpdateStudent({ rulesAccepted: true })}
                onMarkVideoWatched={() => handleUpdateStudent({ videoWatched: true })}
              />

              <LearningStations
                student={currentStudent}
                onUpdateStudent={handleUpdateStudent}
              />

              <AssessmentsSection
                student={currentStudent}
                classmates={classmates}
                onUpdateStudent={handleUpdateStudent}
              />
            </>
          )
        )}
      </main>

      <footer className="border-t border-slate-800/80 bg-[#070D19]/80 py-6 px-4 sm:px-6 no-print">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <span className="font-semibold text-emerald-300">{LESSON_META.attribution}</span>
          <span>المنهج السعودي · المهارات الرقمية · الصف الثالث المتوسط</span>
        </div>
      </footer>
    </div>
  );
}
