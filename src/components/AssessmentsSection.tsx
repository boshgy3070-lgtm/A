import React, { useState } from 'react';
import {
  Award,
  BookMarked,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  Compass,
  HeartHandshake,
  LogOut,
  Play,
  Star,
} from 'lucide-react';
import {
  CROSS_CURRICULAR_LINKS,
  RUBRIC_CRITERIA,
  SELF_ASSESSMENT_ITEMS,
  SUMMATIVE_QUESTIONS,
} from '../data/lessonContent';
import type { StudentRecord } from '../types';

interface AssessmentsSectionProps {
  student: StudentRecord;
  classmates: StudentRecord[];
  onUpdateStudent: (patch: Partial<StudentRecord>) => Promise<void>;
}

const TASK_TEMPLATES = [
  {
    id: 'national_day',
    title: 'المهمة 1: عدّاد اليوم الوطني السعودي (23 سبتمبر) بـ datetime',
    starter: `from datetime import date\ntoday = date.today()\nnationalDay = date(today.year, 9, 23)\nif nationalDay < today:\n    nationalDay = nationalDay.replace(year=today.year + 1)\ndays_left = (nationalDay - today).days\nprint("Days left for Saudi National Day:", days_left)`,
  },
  {
    id: 'circle_math',
    title: 'المهمة 2: حساب مساحة الدائرة وتقريبها بنموذج math',
    starter: `import math\nradius = 5.5\narea = math.pi * math.pow(radius, 2)\nprint("Exact area:", area)\nprint("Ceil:", math.ceil(area))\nprint("Floor:", math.floor(area))`,
  },
];

const EXIT_MOODS = [
  { emoji: '🤩', label: 'فهمت الدرس بامتياز' },
  { emoji: '😊', label: 'مستمتعة ومستوعبة' },
  { emoji: '🤔', label: 'أحتاج مراجعة بسيطة' },
  { emoji: '💡', label: 'متحمسة للتطبيق في PyCharm' },
];

export const AssessmentsSection: React.FC<AssessmentsSectionProps> = ({
  student,
  classmates,
  onUpdateStudent,
}) => {
  // Performance Task
  const [selectedTask, setSelectedTask] = useState(
    student.performanceTask?.selectedTopic || TASK_TEMPLATES[0].title
  );
  const [taskCode, setTaskCode] = useState(
    student.performanceTask?.code || TASK_TEMPLATES[0].starter
  );
  const [taskNotes, setTaskNotes] = useState(student.performanceTask?.notes || '');
  const [simulatedOutput, setSimulatedOutput] = useState<string | null>(null);
  const [taskSaved, setTaskSaved] = useState(false);

  // Summative Quiz
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>(
    student.summativeQuiz?.answers || {}
  );
  const [quizSubmitted, setQuizSubmitted] = useState(Boolean(student.summativeQuiz));

  // Self Assessment
  const [selfRatings, setSelfRatings] = useState<Record<string, number>>(
    student.selfAssessment?.ratings || { sa1: 4, sa2: 4, sa3: 4, sa4: 4 }
  );
  const [selfReflection, setSelfReflection] = useState(
    student.selfAssessment?.reflection || ''
  );
  const [selfSaved, setSelfSaved] = useState(false);

  // Peer Assessment (Two Stars & a Wish)
  const [peerName, setPeerName] = useState(student.peerAssessment?.peerName || '');
  const [star1, setStar1] = useState(student.peerAssessment?.star1 || '');
  const [star2, setStar2] = useState(student.peerAssessment?.star2 || '');
  const [wish, setWish] = useState(student.peerAssessment?.wish || '');
  const [peerRating, setPeerRating] = useState(student.peerAssessment?.rating || 5);
  const [peerSaved, setPeerSaved] = useState(false);

  // Exit Ticket
  const [learned, setLearned] = useState(student.exitTicket?.learned || '');
  const [favoriteLib, setFavoriteLib] = useState(student.exitTicket?.favoriteLib || 'datetime');
  const [exitQuestion, setExitQuestion] = useState(student.exitTicket?.question || '');
  const [moodIcon, setMoodIcon] = useState(student.exitTicket?.moodIcon || '🤩');
  const [exitSaved, setExitSaved] = useState(false);

  const handleSelectTaskTemplate = (tplId: string) => {
    const found = TASK_TEMPLATES.find((t) => t.id === tplId);
    if (!found) return;
    setSelectedTask(found.title);
    setTaskCode(found.starter);
    setSimulatedOutput(null);
  };

  const handleRunTaskPreview = () => {
    if (taskCode.includes('datetime') || taskCode.includes('date')) {
      const today = new Date();
      let target = new Date(today.getFullYear(), 8, 23);
      if (taskCode.includes('2, 22')) {
        target = new Date(today.getFullYear(), 1, 22);
      }
      if (target < today) {
        target = new Date(target.getFullYear() + 1, target.getMonth(), target.getDate());
      }
      const days = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      setSimulatedOutput(
        `Today is: ${today.toISOString().slice(0, 10)}\nTarget Date: ${target.toISOString().slice(0, 10)}\nDays left: ${days}`
      );
    } else if (taskCode.includes('math')) {
      const area = Math.PI * Math.pow(5.5, 2);
      setSimulatedOutput(
        `Exact area: ${area.toFixed(6)}\nCeil: ${Math.ceil(area)}\nFloor: ${Math.floor(area)}`
      );
    } else {
      setSimulatedOutput('تم فحص البنية البرمجية بنجاح — جاهز للتسليم إلى المعلمة.');
    }
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateStudent({
      performanceTask: {
        selectedTopic: selectedTask,
        code: taskCode,
        notes: taskNotes,
        submittedAt: new Date().toISOString(),
        teacherGrade: student.performanceTask?.teacherGrade,
      },
    });
    setTaskSaved(true);
    setTimeout(() => setTaskSaved(false), 3000);
  };

  const handleSubmitQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    let score = 0;
    for (const q of SUMMATIVE_QUESTIONS) {
      if (quizAnswers[q.id] === q.correctIndex) {
        score++;
      }
    }
    await onUpdateStudent({
      summativeQuiz: {
        answers: quizAnswers,
        score,
        total: SUMMATIVE_QUESTIONS.length,
        submittedAt: new Date().toISOString(),
      },
    });
    setQuizSubmitted(true);
  };

  const handleSubmitSelf = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateStudent({
      selfAssessment: {
        ratings: selfRatings,
        reflection: selfReflection,
        submittedAt: new Date().toISOString(),
      },
    });
    setSelfSaved(true);
    setTimeout(() => setSelfSaved(false), 3000);
  };

  const handleSubmitPeer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!peerName.trim()) return;
    await onUpdateStudent({
      peerAssessment: {
        peerName: peerName.trim(),
        star1: star1.trim(),
        star2: star2.trim(),
        wish: wish.trim(),
        rating: peerRating,
        submittedAt: new Date().toISOString(),
      },
    });
    setPeerSaved(true);
    setTimeout(() => setPeerSaved(false), 3000);
  };

  const handleSubmitExit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateStudent({
      exitTicket: {
        learned: learned.trim(),
        favoriteLib,
        question: exitQuestion.trim(),
        moodIcon,
        submittedAt: new Date().toISOString(),
      },
    });
    setExitSaved(true);
    setTimeout(() => setExitSaved(false), 3000);
  };

  const otherClassmates = classmates.filter((c) => c.id !== student.id);

  return (
    <div className="space-y-12">
      {/* Cross-Curricular Links */}
      <section id="links" className="space-y-6">
        <div>
          <p className="text-xs font-semibold text-emerald-300 mb-1">
            التكامل المعرفي والقيمي في المنهج السعودي
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            الربط بالدين والوطن والمواد الأخرى
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {CROSS_CURRICULAR_LINKS.map((link) => (
            <div
              key={link.id}
              className="rounded-2xl bg-slate-900/85 border border-slate-800 p-6 space-y-3"
            >
              <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold">
                <Compass className="w-4 h-4 shrink-0" />
                <span>{link.category}</span>
              </div>
              <h3 className="text-lg font-bold text-white">{link.title}</h3>
              <ul className="space-y-2 text-sm text-slate-300 leading-relaxed list-disc list-inside">
                {link.points.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Performance Task */}
      <section id="task" className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-cyan-300 mb-1">التطبيق العملي الإبداعي</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">المهمة الأدائية البرمجية</h2>
          </div>
          {student.performanceTask?.teacherGrade && (
            <div className="text-sm font-bold text-emerald-300">
              تقدير المعلمة: {student.performanceTask.teacherGrade}
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmitTask}
          className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-5"
        >
          <div className="flex flex-wrap gap-2">
            {TASK_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleSelectTaskTemplate(tpl.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-colors ${
                  selectedTask === tpl.title
                    ? 'bg-cyan-500/15 border-cyan-400 text-cyan-200'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {tpl.title}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-cyan-400" />
                  <span>محرر كود بايثون</span>
                </label>
                <button
                  type="button"
                  onClick={handleRunTaskPreview}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>تشغيل ومعاينة المخرجات</span>
                </button>
              </div>
              <textarea
                rows={8}
                required
                dir="ltr"
                value={taskCode}
                onChange={(e) => setTaskCode(e.target.value)}
                className="w-full rounded-xl bg-[#040811] border border-slate-800 p-4 font-mono text-xs sm:text-sm text-cyan-200 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="lg:col-span-5 flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-300">شاشة المخرجات (Console)</div>
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300 min-h-[120px] whitespace-pre-wrap">
                  {simulatedOutput || 'اضغطي «تشغيل ومعاينة المخرجات» لاختبار الكود قبل التسليم.'}
                </pre>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  ملاحظات الطالبة حول اختيار طريقة الاستيراد
                </label>
                <input
                  type="text"
                  value={taskNotes}
                  onChange={(e) => setTaskNotes(e.target.value)}
                  placeholder="مثال: استخدمت from datetime import date لاستيراد دالة التاريخ فقط."
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-colors"
              >
                {taskSaved ? 'تم تسليم المهمة للمعلمة!' : 'تسليم المهمة الأدائية للمعلمة'}
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* Summative Assessment */}
      <section id="summative" className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-amber-300 mb-1">قياس تحقق أهداف الدرس</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">التقييم الختامي الشامل</h2>
          </div>
          {student.summativeQuiz && (
            <div className="text-base font-bold text-emerald-300 tabular-nums">
              الدرجة: {student.summativeQuiz.score} / {student.summativeQuiz.total}
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmitQuiz}
          className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SUMMATIVE_QUESTIONS.map((q, qIdx) => {
              const selected = quizAnswers[q.id];
              return (
                <div
                  key={q.id}
                  className="p-5 rounded-xl bg-slate-950/75 border border-slate-800 space-y-3"
                >
                  <div className="text-sm font-bold text-white leading-relaxed">
                    <span className="text-cyan-400 tabular-nums ml-1.5">0{qIdx + 1}.</span>
                    {q.question}
                  </div>
                  {q.codeSnippet && (
                    <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-cyan-300 overflow-x-auto">
                      <code>{q.codeSnippet}</code>
                    </pre>
                  )}
                  <div className="space-y-2">
                    {q.options.map((opt, oIdx) => {
                      const isChosen = selected === oIdx;
                      const isRight = q.correctIndex === oIdx;
                      let cls = 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700';
                      if (quizSubmitted) {
                        if (isRight) cls = 'bg-emerald-500/15 border-emerald-500 text-emerald-200';
                        else if (isChosen) cls = 'bg-rose-500/15 border-rose-500 text-rose-200';
                      } else if (isChosen) {
                        cls = 'bg-cyan-500/15 border-cyan-400 text-white';
                      }
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() =>
                            setQuizAnswers((prev) => ({ ...prev, [q.id]: oIdx }))
                          }
                          className={`w-full p-3 rounded-lg border text-right text-xs sm:text-sm transition-colors ${cls}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {quizSubmitted && (
                    <p className="text-xs text-slate-400 leading-relaxed pt-1">
                      <strong className="text-cyan-300">التفسير: </strong>
                      {q.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <span className="text-xs text-slate-400 tabular-nums">
              أجبتِ عن {Object.keys(quizAnswers).length} من {SUMMATIVE_QUESTIONS.length} أسئلة
            </span>
            <button
              type="submit"
              disabled={Object.keys(quizAnswers).length < SUMMATIVE_QUESTIONS.length}
              className="py-3 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-sm transition-colors"
            >
              {quizSubmitted ? 'إعادة اعتماد وحفظ الدرجة' : 'اعتماد التقييم الختامي وإرسال النتيجة'}
            </button>
          </div>
        </form>
      </section>

      {/* Rubric + Self Assessment + Peer Assessment (Two Stars & a Wish) */}
      <section id="rubric" className="space-y-8">
        <div>
          <p className="text-xs font-semibold text-cyan-300 mb-1">
            التقويم الواقعي المستدام
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            سلم التقدير والتقييم الذاتي وتقييم الأقران (نجمتان وأمنية)
          </h2>
        </div>

        {/* Grading Rubric Table */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">سلم التقدير (Rubric)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead className="bg-slate-950 text-slate-300">
                <tr>
                  <th className="p-4 font-bold">معيار التقييم</th>
                  <th className="p-4 font-bold text-emerald-300">ممتاز (4)</th>
                  <th className="p-4 font-bold text-cyan-300">جيد جداً (3)</th>
                  <th className="p-4 font-bold text-amber-300">مقبول (2)</th>
                  <th className="p-4 font-bold text-rose-300">يحتاج دعم (1)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {RUBRIC_CRITERIA.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-800/30">
                    <td className="p-4 font-semibold text-white">{row.criterion}</td>
                    <td className="p-4 leading-relaxed">{row.levels.excellent}</td>
                    <td className="p-4 leading-relaxed">{row.levels.veryGood}</td>
                    <td className="p-4 leading-relaxed">{row.levels.acceptable}</td>
                    <td className="p-4 leading-relaxed">{row.levels.needsSupport}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Self Assessment */}
          <form
            onSubmit={handleSubmitSelf}
            className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 flex flex-col justify-between gap-5"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">التقييم الذاتي للطالبة</h3>
              </div>

              <div className="space-y-3">
                {SELF_ASSESSMENT_ITEMS.map((item) => {
                  const val = selfRatings[item.id] ?? 4;
                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-slate-950/75 border border-slate-800 space-y-2.5"
                    >
                      <div className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                        {item.label}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { v: 4, label: 'أتقنته تماماً' },
                          { v: 3, label: 'جيد جداً' },
                          { v: 2, label: 'أحتاج تدريب' },
                          { v: 1, label: 'أحتاج مساعدة' },
                        ].map((opt) => (
                          <button
                            key={opt.v}
                            type="button"
                            onClick={() =>
                              setSelfRatings((prev) => ({ ...prev, [item.id]: opt.v }))
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              val === opt.v
                                ? 'bg-cyan-500 text-slate-950 font-bold'
                                : 'bg-slate-900 text-slate-400 hover:text-white'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  تأمل ذاتي: ما أكثر مهارة أتقنتِها اليوم؟
                </label>
                <input
                  type="text"
                  value={selfReflection}
                  onChange={(e) => setSelfReflection(e.target.value)}
                  placeholder="اكتبي تأملكِ هنا..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-colors"
            >
              {selfSaved ? 'تم حفظ التقييم الذاتي!' : 'إرسال التقييم الذاتي للمعلمة'}
            </button>
          </form>

          {/* Peer Assessment: Two Stars and a Wish */}
          <form
            onSubmit={handleSubmitPeer}
            className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 flex flex-col justify-between gap-5"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">
                  تقييم الأقران (استراتيجية نجمتان وأمنية)
                </h3>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  اسم الزميلة (من فصل {student.classroom})
                </label>
                {otherClassmates.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pb-1">
                    {otherClassmates.slice(0, 8).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setPeerName(c.name)}
                        className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${
                          peerName === c.name
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
                <input
                  type="text"
                  required
                  value={peerName}
                  onChange={(e) => setPeerName(e.target.value)}
                  placeholder="اكتبي أو اختاري اسم زميلتكِ..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-amber-300 mb-1">
                    النجمة الأولى ★ (نقطة تميز لدى زميلتكِ)
                  </label>
                  <input
                    type="text"
                    required
                    value={star1}
                    onChange={(e) => setStar1(e.target.value)}
                    placeholder="مثال: دقة كتابة أمر import math"
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-300 mb-1">
                    النجمة الثانية ★ (نقطة تميز أخرى)
                  </label>
                  <input
                    type="text"
                    required
                    value={star2}
                    onChange={(e) => setStar2(e.target.value)}
                    placeholder="مثال: سرعة التعاون والمشاركة في المجموعة"
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-cyan-300 mb-1">
                    الأمنية ✨ (تطوير مستقبلي تتمنينه لها)
                  </label>
                  <input
                    type="text"
                    required
                    value={wish}
                    onChange={(e) => setWish(e.target.value)}
                    placeholder="مثال: أتمنى لكِ تصميم واجهة tkinter إبداعية في المشروع القادم"
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-semibold text-slate-300">التقييم العام للأداء:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPeerRating(n)}
                      aria-label={`تقييم ${n} من 5`}
                      className="p-1"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          n <= peerRating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-colors"
            >
              {peerSaved ? 'تم إرسال نجمتان وأمنية!' : 'إرسال تقييم الأقران للمعلمة'}
            </button>
          </form>
        </div>
      </section>

      {/* Exit Ticket */}
      <section id="exit-ticket" className="space-y-6">
        <div>
          <p className="text-xs font-semibold text-amber-300 mb-1">ختام الدرس وغلق التعلم</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">بطاقة الخروج التفاعلية</h2>
        </div>

        <form
          onSubmit={handleSubmitExit}
          className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-cyan-300">
                1. أهم معلومة تعلمتُها اليوم
              </label>
              <textarea
                rows={3}
                required
                value={learned}
                onChange={(e) => setLearned(e.target.value)}
                placeholder="اكتبي خلاصة تعلمكِ في جملة واضحة..."
                className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-emerald-300">
                2. النموذج البرمجي الأكثر إثارة لإعجابي
              </label>
              <select
                value={favoriteLib}
                onChange={(e) => setFavoriteLib(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-400"
              >
                <option value="sys">نموذج sys (معلومات النظام)</option>
                <option value="os">نموذج os (إدارة المجلدات والمسارات)</option>
                <option value="math">نموذج math (الدوال الرياضية والتقريب)</option>
                <option value="tkinter">نموذج tkinter (الواجهات الرسومية)</option>
                <option value="datetime">نموذج datetime (الوقت ويوم التأسيس)</option>
              </select>
              <p className="text-xs text-slate-400 pt-1">
                يمكنكِ استخدام هذا النموذج في مشاريعكِ القادمة في PyCharm.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-amber-300">
                3. سؤال ما زال في ذهني (اختياري)
              </label>
              <textarea
                rows={3}
                value={exitQuestion}
                onChange={(e) => setExitQuestion(e.target.value)}
                placeholder="إن وجد سؤال تودين مناقشته في الحصة القادمة..."
                className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-300 ml-2">شعوري نحو الدرس:</span>
              {EXIT_MOODS.map((m) => (
                <button
                  key={m.emoji}
                  type="button"
                  onClick={() => setMoodIcon(m.emoji)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs transition-colors ${
                    moodIcon === m.emoji
                      ? 'bg-cyan-500/15 border-cyan-400 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="text-base">{m.emoji}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-colors"
            >
              {exitSaved ? <CheckCircle2 className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
              <span>{exitSaved ? 'تم تسليم بطاقة الخروج بنجاح!' : 'تسليم بطاقة الخروج'}</span>
            </button>
          </div>
        </form>
      </section>

      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between flex-wrap gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <BookMarked className="w-4 h-4 text-cyan-400" />
          <span>إعداد معلمة المهارات الرقمية بمتوسطة ديحمة / أسماء قيسي</span>
        </div>
        <span>شكراً لتفاعلكِ المثمر في حصة المكتبات البرمجية</span>
      </div>
    </div>
  );
};
