import React, { useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  ClipboardList,
  FileText,
  Printer,
  RotateCcw,
  Shuffle,
  Smile,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  CLASS_RATING_PRESETS,
  LESSON_META,
  LESSON_OBJECTIVES,
  PEDAGOGICAL_LESSON_PLAN,
  TEACHER_REACTION_PRESETS,
} from '../data/lessonContent';
import {
  CLASSROOM_OPTIONS,
  type ClassroomName,
  type ClassroomState,
  type RubricGrade,
  type StudentRecord,
} from '../types';

interface TeacherDashboardProps {
  teacherName: string;
  initialClassroom: ClassroomName | 'الكل';
  state: ClassroomState;
  onReactStudent: (studentId: string, emoji: string, label: string) => Promise<void>;
  onRateClass: (
    classroom: ClassroomName | 'الكل',
    emoji: string,
    label: string,
    note?: string
  ) => Promise<void>;
  onRandomPick: (student: StudentRecord) => Promise<void>;
  onGradeTask: (studentId: string, grade: RubricGrade) => Promise<void>;
  onAddRoster: (classroom: ClassroomName, names: string[]) => Promise<void>;
  onResetSession: () => Promise<void>;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  teacherName,
  initialClassroom,
  state,
  onReactStudent,
  onRateClass,
  onRandomPick,
  onGradeTask,
  onAddRoster,
  onResetSession,
}) => {
  const [selectedClass, setSelectedClass] = useState<ClassroomName | 'الكل'>(initialClassroom);
  const [activeTab, setActiveTab] = useState<'live' | 'picker' | 'plan'>('live');
  const [inspectedStudentId, setInspectedStudentId] = useState<string | null>(null);

  // Class Rating state
  const [customRatingNote, setCustomRatingNote] = useState('');
  const [customEmoji, setCustomEmoji] = useState('🌟');
  const [customLabel, setCustomLabel] = useState('حصة تفاعلية متميزة');

  // Random Picker state
  const [isSpinning, setIsSpinning] = useState(false);
  const [highlightedName, setHighlightedName] = useState<string | null>(null);
  const [rosterClass, setRosterClass] = useState<ClassroomName>(
    initialClassroom === 'الكل' ? '3م / أ' : initialClassroom
  );
  const [rosterInput, setRosterInput] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const filteredStudents = useMemo(() => {
    if (selectedClass === 'الكل') return state.students;
    return state.students.filter((s) => s.classroom === selectedClass);
  }, [state.students, selectedClass]);

  const inspectedStudent = useMemo(
    () => state.students.find((s) => s.id === inspectedStudentId) || null,
    [state.students, inspectedStudentId]
  );

  const stats = useMemo(() => {
    const total = filteredStudents.length;
    const quizSubmitted = filteredStudents.filter((s) => s.summativeQuiz);
    const avgScore =
      quizSubmitted.length > 0
        ? (
            quizSubmitted.reduce(
              (acc, s) => acc + ((s.summativeQuiz!.score / s.summativeQuiz!.total) * 100),
              0
            ) / quizSubmitted.length
          ).toFixed(0)
        : '—';
    const tasksCount = filteredStudents.filter((s) => s.performanceTask).length;
    const exitsCount = filteredStudents.filter((s) => s.exitTicket).length;
    return { total, avgScore, tasksCount, exitsCount };
  }, [filteredStudents]);

  const handleTriggerRandomPick = () => {
    if (filteredStudents.length === 0 || isSpinning) return;
    setIsSpinning(true);
    let ticks = 0;
    const maxTicks = 16;
    const timer = setInterval(async () => {
      const rand = filteredStudents[Math.floor(Math.random() * filteredStudents.length)];
      setHighlightedName(`${rand.name} (${rand.classroom})`);
      ticks++;
      if (ticks >= maxTicks) {
        clearInterval(timer);
        const winner = filteredStudents[Math.floor(Math.random() * filteredStudents.length)];
        setHighlightedName(`${winner.name} (${winner.classroom})`);
        setIsSpinning(false);
        await onRandomPick(winner);
      }
    }, 95);
  };

  const handleAddRosterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const names = rosterInput
      .split(/[\n,،]+/)
      .map((n) => n.trim())
      .filter((n) => n.length >= 2);
    if (names.length === 0) return;
    await onAddRoster(rosterClass, names);
    setRosterInput('');
  };

  const latestPick = state.randomPicks[0];

  return (
    <div className="space-y-8">
      {/* Header & Class Filter */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 flex flex-wrap items-center justify-between gap-4 no-print">
        <div>
          <div className="text-xs font-semibold text-emerald-300">
            لوحة المعلمة الحية · {teacherName} · {LESSON_META.school}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
            متابعة التفاعل وإدارة الصف التطبيقي
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800">
            {(['الكل', ...CLASSROOM_OPTIONS] as Array<ClassroomName | 'الكل'>).map((cls) => (
              <button
                key={cls}
                type="button"
                onClick={() => setSelectedClass(cls)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  selectedClass === cls
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {cls}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('live')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'live'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              نتائج الطالبات وتقييم الحصة
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('picker')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'picker'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              الاختيار العشوائي
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('plan')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'plan'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              خطة الدرس التربوية
            </button>
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 no-print">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400">الطالبات المسجلات</div>
          <div className="text-2xl font-bold text-white mt-1 tabular-nums">{stats.total}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400">متوسط التقييم الختامي</div>
          <div className="text-2xl font-bold text-cyan-300 mt-1 tabular-nums">
            {stats.avgScore === '—' ? '—' : `${stats.avgScore}%`}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400">المهام الأدائية المسلمة</div>
          <div className="text-2xl font-bold text-emerald-300 mt-1 tabular-nums">{stats.tasksCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400">بطاقات الخروج</div>
          <div className="text-2xl font-bold text-amber-300 mt-1 tabular-nums">{stats.exitsCount}</div>
        </div>
      </div>

      {activeTab === 'live' && (
        <div className="space-y-8">
          {/* Class Rating Panel (Emojis / Icons) */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Smile className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white">
                  تقييم الحصة بالفيسات والأيقونات التحفيزية ({selectedClass})
                </h2>
              </div>
              <span className="text-xs text-slate-400">يظهر التقييم مباشرة في شاشات الطالبات</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {CLASS_RATING_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => onRateClass(selectedClass, preset.emoji, preset.label)}
                  className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-400/50 text-right transition-colors flex items-center gap-2.5"
                >
                  <span className="text-2xl shrink-0">{preset.emoji}</span>
                  <span className="text-xs font-semibold text-slate-200 leading-snug">
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await onRateClass(selectedClass, customEmoji, customLabel, customRatingNote);
                setCustomRatingNote('');
              }}
              className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800"
            >
              <select
                value={customEmoji}
                onChange={(e) => setCustomEmoji(e.target.value)}
                aria-label="اختيار أيقونة"
                className="rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-base"
              >
                <option value="🌟">🌟</option>
                <option value="🏆">🏆</option>
                <option value="💡">💡</option>
                <option value="👏">👏</option>
                <option value="🔥">🔥</option>
                <option value="💖">💖</option>
              </select>
              <input
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="عنوان التقييم..."
                className="flex-1 min-w-[160px] rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-sm text-slate-100"
              />
              <input
                type="text"
                value={customRatingNote}
                onChange={(e) => setCustomRatingNote(e.target.value)}
                placeholder="رسالة تشجيعية اختيارية للفصل..."
                className="flex-1 min-w-[200px] rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-sm text-slate-100"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm transition-colors"
              >
                إرسال التقييم للحصة
              </button>
            </form>

            {state.classRatings.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {state.classRatings.slice(0, 5).map((r) => (
                  <div
                    key={r.id}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center gap-2"
                  >
                    <span className="text-base">{r.emoji}</span>
                    <span className="font-semibold text-white">{r.label}</span>
                    <span className="text-slate-500">· {r.classroom}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Students Table + Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-lg font-bold text-white">سجل تفاعل الطالبات المباشر</h2>
                </div>
                {!confirmReset ? (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-300 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>بدء حصة جديدة</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        await onResetSession();
                        setConfirmReset(false);
                        setInspectedStudentId(null);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-rose-500 text-white text-xs font-bold"
                    >
                      تأكيد المسح
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs"
                    >
                      إلغاء
                    </button>
                  </div>
                )}
              </div>

              {filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-400">
                  لم تنضم أي طالبة في ({selectedClass}) بعد. بمجرد دخول الطالبات أو إضافتهن ستظهر
                  نتائجهن هنا لحظياً.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs sm:text-sm">
                    <thead className="bg-slate-950 text-slate-400">
                      <tr>
                        <th className="p-3.5 font-semibold">الطالبة</th>
                        <th className="p-3.5 font-semibold">الفصل</th>
                        <th className="p-3.5 font-semibold">المحطات</th>
                        <th className="p-3.5 font-semibold">الختامي</th>
                        <th className="p-3.5 font-semibold">المهمة</th>
                        <th className="p-3.5 font-semibold">الخروج</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredStudents.map((stu) => {
                        const selected = stu.id === inspectedStudentId;
                        return (
                          <tr
                            key={stu.id}
                            onClick={() => setInspectedStudentId(stu.id)}
                            className={`cursor-pointer transition-colors ${
                              selected ? 'bg-cyan-500/10' : 'hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="p-3.5 font-semibold text-white">
                              <div>{stu.name}</div>
                              {stu.teacherReactions.length > 0 && (
                                <div className="text-xs mt-0.5">
                                  {stu.teacherReactions.slice(0, 3).map((r) => r.emoji).join(' ')}
                                </div>
                              )}
                            </td>
                            <td className="p-3.5 text-slate-300 whitespace-nowrap">{stu.classroom}</td>
                            <td className="p-3.5 text-cyan-300 tabular-nums">
                              {stu.completedStations.length} / 5
                            </td>
                            <td className="p-3.5 tabular-nums">
                              {stu.summativeQuiz ? (
                                <span className="text-emerald-300 font-bold">
                                  {stu.summativeQuiz.score}/{stu.summativeQuiz.total}
                                </span>
                              ) : (
                                <span className="text-slate-500">—</span>
                              )}
                            </td>
                            <td className="p-3.5">
                              {stu.performanceTask ? (
                                <span className="text-emerald-300 font-medium">
                                  {stu.performanceTask.teacherGrade || 'تم التسليم'}
                                </span>
                              ) : (
                                <span className="text-slate-500">—</span>
                              )}
                            </td>
                            <td className="p-3.5">
                              {stu.exitTicket ? (
                                <span title={stu.exitTicket.learned}>{stu.exitTicket.moodIcon}</span>
                              ) : (
                                <span className="text-slate-500">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Student Inspector */}
            <div className="lg:col-span-5 rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-5">
              {!inspectedStudent ? (
                <div className="py-12 text-center text-sm text-slate-400">
                  اختاري اسم طالبة من الجدول لعرض تفاصيل إجاباتها وتقييمها وإرسال الأيقونات التحفيزية لها.
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">{inspectedStudent.name}</h3>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {inspectedStudent.classroom} · القوانين:{' '}
                        {inspectedStudent.rulesAccepted ? 'متعهدة' : 'لم تتعهد'} · الفيديو:{' '}
                        {inspectedStudent.videoWatched ? 'تمت المشاهدة' : 'قيد العرض'}
                      </div>
                    </div>
                  </div>

                  {/* Quick Reaction Buttons */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-amber-300">
                      منح فيس / وسام تحفيزي للطالبة:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {TEACHER_REACTION_PRESETS.map((rx) => (
                        <button
                          key={rx.label}
                          type="button"
                          onClick={() =>
                            onReactStudent(inspectedStudent.id, rx.emoji, rx.label)
                          }
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 transition-colors"
                        >
                          <span>{rx.emoji}</span>
                          <span>{rx.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Think Pair Share */}
                  {inspectedStudent.thinkPairShare && (
                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs">
                      <div className="font-bold text-amber-300">نشاط فكر - زاوج - شارك:</div>
                      <div><strong className="text-slate-300">أفكاري:</strong> {inspectedStudent.thinkPairShare.myIdea}</div>
                      <div><strong className="text-slate-300">أفكار زميلتي:</strong> {inspectedStudent.thinkPairShare.partnerIdea}</div>
                      <div><strong className="text-slate-300">المجموعة:</strong> {inspectedStudent.thinkPairShare.groupSummary}</div>
                    </div>
                  )}

                  {/* Import * Comparison */}
                  {inspectedStudent.compareImportStar && (
                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs">
                      <div className="font-bold text-cyan-300">مقارنة import *:</div>
                      <div><strong className="text-emerald-300">المميزات:</strong> {inspectedStudent.compareImportStar.pros}</div>
                      <div><strong className="text-rose-300">العيوب:</strong> {inspectedStudent.compareImportStar.cons}</div>
                    </div>
                  )}

                  {/* Try Yourself -3.4 */}
                  {inspectedStudent.tryYourselfMath && (
                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs flex items-center justify-between">
                      <span>تحدي (-3.4): ceil={inspectedStudent.tryYourselfMath.ceilAns}, floor={inspectedStudent.tryYourselfMath.floorAns}</span>
                      <span className={inspectedStudent.tryYourselfMath.isCorrect ? 'text-emerald-300 font-bold' : 'text-rose-300'}>
                        {inspectedStudent.tryYourselfMath.isCorrect ? 'صحيحة' : 'تحتاج مراجعة'}
                      </span>
                    </div>
                  )}

                  {/* Performance Task + Rubric Grading */}
                  {inspectedStudent.performanceTask && (
                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5 text-xs">
                      <div className="font-bold text-emerald-300">
                        المهمة الأدائية: {inspectedStudent.performanceTask.selectedTopic}
                      </div>
                      <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-200 overflow-x-auto">
                        <code>{inspectedStudent.performanceTask.code}</code>
                      </pre>
                      {inspectedStudent.performanceTask.notes && (
                        <div className="text-slate-300">ملاحظتها: {inspectedStudent.performanceTask.notes}</div>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-slate-400">التقدير وفق السلم:</span>
                        {(['ممتاز', 'جيد جداً', 'مقبول', 'يحتاج دعم'] as RubricGrade[]).map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => onGradeTask(inspectedStudent.id, g)}
                            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                              inspectedStudent.performanceTask?.teacherGrade === g
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-800 text-slate-300 hover:text-white'
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Peer Assessment */}
                  {inspectedStudent.peerAssessment && (
                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1 text-xs">
                      <div className="font-bold text-emerald-300">
                        نجمتان وأمنية لزميلتها ({inspectedStudent.peerAssessment.peerName}):
                      </div>
                      <div>★ {inspectedStudent.peerAssessment.star1}</div>
                      <div>★ {inspectedStudent.peerAssessment.star2}</div>
                      <div>✨ {inspectedStudent.peerAssessment.wish}</div>
                    </div>
                  )}

                  {/* Exit Ticket */}
                  {inspectedStudent.exitTicket && (
                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1 text-xs">
                      <div className="font-bold text-amber-300">
                        بطاقة الخروج {inspectedStudent.exitTicket.moodIcon}:
                      </div>
                      <div><strong className="text-slate-300">تعلمت:</strong> {inspectedStudent.exitTicket.learned}</div>
                      <div><strong className="text-slate-300">النموذج المفضل:</strong> {inspectedStudent.exitTicket.favoriteLib}</div>
                      {inspectedStudent.exitTicket.question && (
                        <div><strong className="text-slate-300">سؤالها:</strong> {inspectedStudent.exitTicket.question}</div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'picker' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 flex flex-col justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-cyan-300">
                <Shuffle className="w-5 h-5" />
                <h2 className="text-xl font-bold text-white">
                  أداة الاختيار العشوائي للطالبات ({selectedClass})
                </h2>
              </div>
              <p className="text-sm text-slate-400">
                اضغطي لاختيار طالبة عشوائياً للمشاركة، ويظهر الاختيار مباشرة على شاشات الطالبات.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-950 border border-cyan-500/35 text-center space-y-4">
              <div className="text-xs font-semibold text-cyan-300">
                {isSpinning ? 'جاري السحب العشوائي...' : 'الطالبة المختارة للمشاركة'}
              </div>
              <div className="text-2xl sm:text-4xl font-bold text-white min-h-[48px] flex items-center justify-center">
                {highlightedName ||
                  (latestPick
                    ? `${latestPick.studentName} (${latestPick.classroom})`
                    : 'بانتظار السحب العشوائي')}
              </div>

              <button
                type="button"
                onClick={handleTriggerRandomPick}
                disabled={filteredStudents.length === 0 || isSpinning}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-base transition-colors"
              >
                <Sparkles className="w-5 h-5" />
                <span>
                  {filteredStudents.length === 0
                    ? 'أضيفي طالبات أو انتظري دخولهن أولاً'
                    : isSpinning
                    ? 'جاري الاختيار...'
                    : `اختيار عشوائي من ${filteredStudents.length} طالبة`}
                </span>
              </button>
            </div>

            {latestPick && (
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="text-xs font-semibold text-amber-300">
                  تحفيز فوري للطالبة المختارة ({latestPick.studentName}):
                </div>
                <div className="flex flex-wrap gap-2">
                  {TEACHER_REACTION_PRESETS.map((rx) => (
                    <button
                      key={rx.label}
                      type="button"
                      onClick={() => onReactStudent(latestPick.studentId, rx.emoji, rx.label)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 transition-colors"
                    >
                      <span>{rx.emoji}</span>
                      <span>{rx.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-5">
            <div className="flex items-center gap-2 text-emerald-300">
              <UserPlus className="w-5 h-5" />
              <h3 className="text-lg font-bold text-white">إضافة قائمة أسماء الفصل</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              إذا كانت الطالبات يتفاعلن عبر الشاشة الجماعية، يمكنكِ لصق أسمائهن هنا (سطر لكل اسم أو
              مفصولة بفاصلة) لتشملهن القرعة العشوائية فوراً.
            </p>

            <form onSubmit={handleAddRosterSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">الفصل</label>
                <select
                  value={rosterClass}
                  onChange={(e) => setRosterClass(e.target.value as ClassroomName)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-slate-100"
                >
                  {CLASSROOM_OPTIONS.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">أسماء الطالبات</label>
                <textarea
                  rows={5}
                  value={rosterInput}
                  onChange={(e) => setRosterInput(e.target.value)}
                  placeholder={'مثال:\nسارة محمد\nنورة علي\nرهف خالد'}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-sm text-slate-100"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-colors"
              >
                إضافة الأسماء للقائمة
              </button>
            </form>

            {state.randomPicks.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <div className="text-xs font-semibold text-slate-400">سجل الاختيارات الأخيرة:</div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {state.randomPicks.slice(0, 6).map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-slate-950 border border-slate-800"
                    >
                      <span className="text-slate-100 font-medium">{p.studentName}</span>
                      <span className="text-cyan-300">{p.classroom}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'plan' && (
        <div className="rounded-2xl bg-slate-900/95 border border-slate-800 p-6 sm:p-8 space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="text-xs font-semibold text-emerald-300">
                {PEDAGOGICAL_LESSON_PLAN.header.region} · {PEDAGOGICAL_LESSON_PLAN.header.school}
              </div>
              <h2 className="text-2xl font-bold text-white mt-1">
                خطة الدرس التربوية المتكاملة (درس تطبيقي)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {LESSON_META.attribution}
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="no-print inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة خطة الدرس</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-slate-400">المادة والصف</div>
              <div className="text-white font-semibold mt-1">
                {PEDAGOGICAL_LESSON_PLAN.header.subject} · {PEDAGOGICAL_LESSON_PLAN.header.grade}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-slate-400">الوحدة والدرس</div>
              <div className="text-white font-semibold mt-1">
                {PEDAGOGICAL_LESSON_PLAN.header.lesson}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-slate-400">الزمن المقترح</div>
              <div className="text-cyan-300 font-semibold mt-1">
                {PEDAGOGICAL_LESSON_PLAN.header.duration}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-slate-400">بيئة التنفيذ</div>
              <div className="text-emerald-300 font-semibold mt-1">
                {PEDAGOGICAL_LESSON_PLAN.header.environment}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>الأهداف السلوكية (المعرفية · المهارية · الوجدانية)</span>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-300 list-disc list-inside leading-relaxed">
                {LESSON_OBJECTIVES.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </div>

            <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                <ClipboardList className="w-4 h-4" />
                <span>إدارة الصف والتفاعل الإيجابي</span>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-300 list-disc list-inside leading-relaxed">
                {PEDAGOGICAL_LESSON_PLAN.classroomManagement.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <Award className="w-4 h-4" />
              <span>استراتيجيات التدريس النشط المطبقة</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {PEDAGOGICAL_LESSON_PLAN.strategies.map((s) => (
                <div key={s.name} className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-sm font-bold text-white">{s.name}</div>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{s.role}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
              <FileText className="w-4 h-4" />
              <span>السيناريو الزمني وتوزيع الحصة (40 دقيقة)</span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead className="bg-slate-950 text-slate-300">
                  <tr>
                    <th className="p-3.5 font-bold">المرحلة</th>
                    <th className="p-3.5 font-bold">الزمن</th>
                    <th className="p-3.5 font-bold">النشاط التعليمي والتفاعل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {PEDAGOGICAL_LESSON_PLAN.timeline.map((row) => (
                    <tr key={row.phase}>
                      <td className="p-3.5 font-semibold text-white">{row.phase}</td>
                      <td className="p-3.5 text-cyan-300 tabular-nums whitespace-nowrap">{row.minutes}</td>
                      <td className="p-3.5 leading-relaxed">{row.activity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30">
              <div className="font-bold text-emerald-300 mb-1">التمايز والإثراء (المتميزات)</div>
              <p className="text-slate-300 leading-relaxed">
                {PEDAGOGICAL_LESSON_PLAN.differentiation.enrichment}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30">
              <div className="font-bold text-amber-300 mb-1">الدعم والعلاج (الاحتياجات الفردية)</div>
              <p className="text-slate-300 leading-relaxed">
                {PEDAGOGICAL_LESSON_PLAN.differentiation.support}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
