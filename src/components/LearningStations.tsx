import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  FolderOpen,
  Monitor,
  Play,
  Sliders,
  Terminal,
  Users,
} from 'lucide-react';
import { FORMATIVE_QUESTIONS, LEARNING_STATIONS } from '../data/lessonContent';
import type { StudentRecord } from '../types';

interface LearningStationsProps {
  student: StudentRecord;
  onUpdateStudent: (patch: Partial<StudentRecord>) => Promise<void>;
}

const DEFAULT_PATH = 'C:\\Users\\BL\\AppData\\Local\\Programs\\Python\\Python37-32';
const DESKTOP_PATH = 'C:\\Users\\BL\\Desktop';

export const LearningStations: React.FC<LearningStationsProps> = ({
  student,
  onUpdateStudent,
}) => {
  const [activeStation, setActiveStation] = useState<string>('s1');

  // Station 1: Think-Pair-Share
  const [myIdea, setMyIdea] = useState(student.thinkPairShare?.myIdea ?? '');
  const [partnerIdea, setPartnerIdea] = useState(student.thinkPairShare?.partnerIdea ?? '');
  const [groupSummary, setGroupSummary] = useState(student.thinkPairShare?.groupSummary ?? '');
  const [tpsSaved, setTpsSaved] = useState(false);

  // Station 2: Import Methods & Comparison
  const [importMode, setImportMode] = useState<'all' | 'specific' | 'module'>('module');
  const [pros, setPros] = useState(student.compareImportStar?.pros ?? '');
  const [cons, setCons] = useState(student.compareImportStar?.cons ?? '');
  const [compareSaved, setCompareSaved] = useState(false);

  // Station 3: sys & os simulator
  const [cwd, setCwd] = useState<string>(DEFAULT_PATH);
  const [terminalLogs, setTerminalLogs] = useState<Array<{ cmd: string; out: string }>>([
    {
      cmd: 'import sys\nprint(sys.platform)',
      out: "'win32'",
    },
  ]);

  // Station 4: math & tkinter
  const [angleDeg, setAngleDeg] = useState<number>(60);
  const [powBase, setPowBase] = useState<number>(2);
  const [powExp, setPowExp] = useState<number>(8);
  const [sqrtVal, setSqrtVal] = useState<number>(20);
  const [roundVal, setRoundVal] = useState<number>(10.1657);
  const [ceilAns, setCeilAns] = useState(student.tryYourselfMath?.ceilAns ?? '');
  const [floorAns, setFloorAns] = useState(student.tryYourselfMath?.floorAns ?? '');
  const [tkTitle, setTkTitle] = useState('Hello Python');
  const [tkWidth, setTkWidth] = useState(300);
  const [tkHeight, setTkHeight] = useState(180);

  // Station 5: time & datetime Foundation Day
  const [simDateStr, setSimDateStr] = useState('2023-11-15');

  const currentFormative = FORMATIVE_QUESTIONS.find((q) => q.stationId === activeStation);
  const formativeState = currentFormative
    ? student.formativeAnswers[currentFormative.id]
    : undefined;

  const isCompleted = (id: string) => student.completedStations.includes(id);

  const markStationCompleted = async (id: string) => {
    await onUpdateStudent({ completedStations: [id] });
  };

  const handleSaveTps = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateStudent({
      thinkPairShare: {
        myIdea,
        partnerIdea,
        groupSummary,
        submittedAt: new Date().toISOString(),
      },
      completedStations: ['s1'],
    });
    setTpsSaved(true);
    setTimeout(() => setTpsSaved(false), 2500);
  };

  const handleSaveCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateStudent({
      compareImportStar: {
        pros,
        cons,
        submittedAt: new Date().toISOString(),
      },
      completedStations: ['s2'],
    });
    setCompareSaved(true);
    setTimeout(() => setCompareSaved(false), 2500);
  };

  const handleAnswerFormative = async (questionId: string, selectedIndex: number, correctIndex: number) => {
    await onUpdateStudent({
      formativeAnswers: {
        [questionId]: {
          selectedIndex,
          isCorrect: selectedIndex === correctIndex,
        },
      },
    });
  };

  const runOsCommand = (action: 'version' | 'path' | 'platform' | 'getcwd' | 'chdir_desktop' | 'chdir_back' | 'listdir' | 'dir_os') => {
    if (action === 'version') {
      setTerminalLogs((prev) => [
        ...prev,
        {
          cmd: 'import sys\nprint(sys.version)',
          out: '3.7.0 (v3.7.0:c2f86d86e6, Oct 19 2019, 10:49:36) [MSC v.1500 32 bit (Intel)]',
        },
      ]);
    } else if (action === 'path') {
      setTerminalLogs((prev) => [
        ...prev,
        {
          cmd: 'print(sys.path)',
          out: "['c:\\\\Users\\\\BL\\\\Desktop\\\\Python Documents', 'C:\\\\Python37\\\\lib', 'C:\\\\Python37\\\\lib\\\\site-packages']",
        },
      ]);
    } else if (action === 'platform') {
      setTerminalLogs((prev) => [
        ...prev,
        {
          cmd: 'print(sys.platform)',
          out: "'win32'  # يعمل الجهاز على نظام تشغيل Windows",
        },
      ]);
    } else if (action === 'getcwd') {
      setTerminalLogs((prev) => [
        ...prev,
        {
          cmd: 'import os\nprint(os.getcwd())',
          out: `'${cwd}'`,
        },
      ]);
    } else if (action === 'chdir_desktop') {
      setCwd(DESKTOP_PATH);
      setTerminalLogs((prev) => [
        ...prev,
        {
          cmd: 'os.chdir("C:\\\\Users\\\\BL\\\\Desktop")\nprint(os.getcwd())',
          out: `'${DESKTOP_PATH}'`,
        },
      ]);
    } else if (action === 'chdir_back') {
      setCwd(DEFAULT_PATH);
      setTerminalLogs((prev) => [
        ...prev,
        {
          cmd: 'os.chdir("..")\nprint(os.getcwd())',
          out: `'${DEFAULT_PATH}'`,
        },
      ]);
    } else if (action === 'listdir') {
      const files =
        cwd === DESKTOP_PATH
          ? "['homework.py', 'foundation_day.py', 'PyCharm Projects']"
          : "['DLLs', 'Doc', 'include', 'Lib', 'libs', 'LICENSE.txt', 'python.exe', 'Scripts', 'tcl', 'Tools']";
      setTerminalLogs((prev) => [
        ...prev,
        {
          cmd: 'print(os.listdir())',
          out: files,
        },
      ]);
    } else if (action === 'dir_os') {
      setTerminalLogs((prev) => [
        ...prev,
        {
          cmd: 'print(dir(os))',
          out: "['F_OK', 'O_APPEND', ..., 'chdir', 'chmod', 'close', 'curdir', 'getcwd', 'listdir', 'mkdir', 'open', 'path', 'remove', 'rename', 'rmdir', 'system', 'walk', 'write']",
        },
      ]);
    }
  };

  const handleCheckTryYourself = async (e: React.FormEvent) => {
    e.preventDefault();
    const cClean = ceilAns.trim();
    const fClean = floorAns.trim();
    const isCorrect = (cClean === '-3' || cClean === '-3.0') && (fClean === '-4' || fClean === '-4.0');
    await onUpdateStudent({
      tryYourselfMath: {
        ceilAns: cClean,
        floorAns: fClean,
        isCorrect,
        submittedAt: new Date().toISOString(),
      },
      completedStations: ['s4'],
    });
  };

  const foundationCalc = useMemo(() => {
    const parsed = new Date(`${simDateStr}T00:00:00`);
    const safeToday = Number.isNaN(parsed.getTime()) ? new Date('2023-11-15T00:00:00') : parsed;
    const year = safeToday.getFullYear();
    let fDay = new Date(year, 1, 22); // Month 1 is Feb
    let replaced = false;
    if (fDay < safeToday) {
      fDay = new Date(year + 1, 1, 22);
      replaced = true;
    }
    const diffMs = fDay.getTime() - safeToday.getTime();
    const daysLeft = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const pad = (n: number) => String(n).padStart(2, '0');
    return {
      todayStr: `${safeToday.getFullYear()}-${pad(safeToday.getMonth() + 1)}-${pad(safeToday.getDate())}`,
      day: safeToday.getDate(),
      month: safeToday.getMonth() + 1,
      year: safeToday.getFullYear(),
      foundationInitial: `${year}-02-22`,
      foundationTarget: `${fDay.getFullYear()}-02-22`,
      replaced,
      daysLeft,
    };
  }, [simDateStr]);

  const rad = (angleDeg * Math.PI) / 180;

  return (
    <section id="stations" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-cyan-300 mb-1">
            التعلم النشط بالمحطات · تزامن تلقائي مع لوحة المعلمة
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">محطات التعلم التفاعلية</h2>
        </div>
        <div className="text-sm text-slate-300 tabular-nums">
          المحطات المنجزة: <span className="font-bold text-emerald-300">{student.completedStations.length}</span> / 5
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {LEARNING_STATIONS.map((st) => {
          const active = activeStation === st.id;
          const done = isCompleted(st.id);
          return (
            <button
              key={st.id}
              type="button"
              onClick={() => setActiveStation(st.id)}
              className={`p-3.5 rounded-xl border text-right transition-colors flex flex-col justify-between gap-1.5 ${
                active
                  ? 'bg-cyan-500/15 border-cyan-400 text-white'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-mono text-cyan-300 tabular-nums">{st.number}</span>
                {done && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              </div>
              <div className="text-sm font-bold leading-snug">{st.title}</div>
              <div className="text-xs text-slate-400">{st.duration}</div>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 space-y-8">
        {activeStation === 's1' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-5">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    01. المكتبات البرمجية والنماذج البرمجية (Modules)
                  </h3>
                  <p className="text-slate-300 text-sm sm:text-base mt-2 leading-relaxed">
                    <strong className="text-cyan-300">المكتبة البرمجية (Programming Library):</strong>{' '}
                    مجموعة من التعليمات البرمجية المدمجة سابقاً في لغات البرمجة، وتُستخدم لتقليل الوقت
                    المستغرق في البرمجة الفعلية، وتُعد موارد قابلة لإعادة الاستخدام لأنها مستقلة عن
                    البرامج التي يتم كتابتها.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="text-sm font-bold text-emerald-300">خصائص المكتبة البرمجية الخمس:</div>
                  <ul className="space-y-1.5 text-sm text-slate-300 list-disc list-inside">
                    <li>يمكن كتابة المكتبة البرمجية بأي لغة برمجة، وتُستخدم غالباً في بيئات تطوير البرامج.</li>
                    <li>تُعد مفيدة جداً للوصول إلى التعليمات المكتوبة سابقاً بدلاً من كتابتها من الصفر.</li>
                    <li>تُنظم بحيث يمكن استخدامها من قبل برامج متعددة ذات طبيعة مختلفة.</li>
                    <li>تُستدعى الوظيفة أو المهمة عبر آلية تتوفر في لغة البرمجة.</li>
                    <li>يحتاج المستخدم فقط إلى معرفة وظيفة المكتبة وليس تفاصيلها الداخلية.</li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-sm font-bold text-white mb-1">النموذج البرمجي (Module)</div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      حزمة من الملفات تحتوي على مقاطع برمجية ودوال جاهزة، يتم استيرادها إلى البرنامج
                      لتنفيذ وظائف مختلفة ويكون امتدادها عادةً <code className="text-cyan-300">.py</code>.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-sm font-bold text-white mb-1">أهمية النماذج البرمجية</div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      1) إعادة استخدام المقطع البرمجي. <br />
                      2) المساعدة في تنظيم المشروعات وتقسيمها.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-sm font-bold text-white mb-2">أمثلة النماذج القياسية في بايثون:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="font-mono text-cyan-300">tkinter module</span> — واجهة المستخدم الرسومية
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="font-mono text-cyan-300">Platform module</span> — خصائص الحاسب ونظام التشغيل
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="font-mono text-cyan-300">turtle module</span> — رسم الأشكال الهندسية
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="font-mono text-cyan-300">openpyxl module</span> — قراءة وكتابة ملفات إكسل
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <form
                  onSubmit={handleSaveTps}
                  className="rounded-xl bg-slate-950/80 border border-slate-800 p-5 space-y-4 h-full flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-amber-300">
                      <Users className="w-5 h-5" />
                      <h4 className="text-base font-bold text-white">
                        نشاط استراتيجية (فكر · زاوج · شارك)
                      </h4>
                    </div>
                    <p className="text-xs text-slate-300">
                      السؤال: باستخدام استراتيجية فكر-زاوج-شارك، عددي خصائص المكتبات البرمجية الجاهزة؟
                    </p>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-cyan-300">1. أفكاري</label>
                      <textarea
                        rows={2}
                        required
                        value={myIdea}
                        onChange={(e) => setMyIdea(e.target.value)}
                        placeholder="اكتبي فكرتكِ هنا..."
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-emerald-300">2. أفكار زميلتي</label>
                      <textarea
                        rows={2}
                        required
                        value={partnerIdea}
                        onChange={(e) => setPartnerIdea(e.target.value)}
                        placeholder="ما أضافته زميلتكِ..."
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-amber-300">3. أفكار المجموعة</label>
                      <textarea
                        rows={2}
                        required
                        value={groupSummary}
                        onChange={(e) => setGroupSummary(e.target.value)}
                        placeholder="الخلاصة المتفق عليها..."
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm transition-colors"
                  >
                    {tpsSaved ? 'تم الإرسال إلى لوحة المعلمة!' : 'إرسال إجابة فكر-زاوج-شارك'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeStation === 's2' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-5">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    02. مكتبة بايثون القياسية وطرق الاستيراد الثلاث
                  </h3>
                  <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                    تُثبَّت <strong className="text-cyan-300">مكتبة بايثون القياسية (Standard Library)</strong>{' '}
                    تلقائياً عند تثبيت بايثون وتضم أكثر من 200 نموذج برمجي (بعضها مكتوب بلغة C). أما{' '}
                    <strong className="text-emerald-300">المكتبات الخارجية (External Libraries)</strong>{' '}
                    مثل <code className="text-emerald-300">pygame</code> فتُثبَّت عبر مدير حزم بايثون (<code className="text-emerald-300">pip</code>).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/75 border border-slate-800">
                  <div className="text-xs font-semibold text-slate-400 mb-3">
                    البنية الهرمية للمكتبة القياسية:
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
                    <div className="px-4 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/40 text-cyan-200 font-bold">
                      المكتبة القياسية (Standard Library)
                    </div>
                    <span className="text-slate-500">←</span>
                    <div className="px-4 py-2.5 rounded-xl bg-slate-900 border border-emerald-500/40 text-emerald-200 font-bold">
                      النموذج البرمجي (Module: math / os)
                    </div>
                    <span className="text-slate-500">←</span>
                    <div className="px-4 py-2.5 rounded-xl bg-slate-900 border border-amber-500/40 text-amber-200 font-bold">
                      الدالة (Function: pow / getcwd)
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-bold text-white">جربي استعراض طرق الاستيراد الثلاث:</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setImportMode('all')}
                      className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        importMode === 'all'
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      1. استيراد الكل (*)
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportMode('specific')}
                      className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        importMode === 'specific'
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      2. استيراد دوال محددة
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportMode('module')}
                      className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        importMode === 'module'
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      3. استيراد النموذج (الأفضل)
                    </button>
                  </div>

                  {importMode === 'all' && (
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <pre className="text-xs sm:text-sm text-cyan-300 overflow-x-auto">
                        <code>{`# استورد الكل من النموذج البرمجي\nfrom module_name import *\n# استدعي دالة مباشرة باسمها\nfunction_name()`}</code>
                      </pre>
                      <p className="text-xs text-slate-400">
                        تُقرأ جميع دوال النموذج وتسقط في البرنامج مباشرة، مما قد يزيد حجم الكود وأعباء الصيانة والأمن.
                      </p>
                    </div>
                  )}

                  {importMode === 'specific' && (
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <pre className="text-xs sm:text-sm text-cyan-300 overflow-x-auto">
                        <code>{`# استورد دوال محددة فقط\nfrom module_name import function_a, function_b\nfunction_a()\nfunction_b()`}</code>
                      </pre>
                      <p className="text-xs text-slate-400">
                        تستورد فقط الدوال التي تحتاجينها في مقطعكِ البرمجي.
                      </p>
                    </div>
                  )}

                  {importMode === 'module' && (
                    <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-2">
                      <pre className="text-xs sm:text-sm text-emerald-300 overflow-x-auto">
                        <code>{`# الطريقة الأفضل: استيراد النموذج ثم ذكر اسمه قبل الدالة\nimport module_name\nmodule_name.function_name()`}</code>
                      </pre>
                      <p className="text-xs text-slate-300">
                        تُعد أفضل طريقة لأنها تنظم الكود وتمنع تداخل أسماء الدوال وتوضح مصدر كل دالة.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-5">
                <form
                  onSubmit={handleSaveCompare}
                  className="rounded-xl bg-slate-950/80 border border-slate-800 p-5 space-y-4 h-full flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <h4 className="text-base font-bold text-white">
                      نشاط تنمية مهارة التفكير: المقارنة
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      قارني بين <strong className="text-emerald-300">مميزات</strong> و{' '}
                      <strong className="text-rose-300">عيوب</strong> طريقة استيراد الكل{' '}
                      <code className="text-cyan-300">from module import *</code>:
                    </p>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-emerald-300">
                        مميزات طريقة استيراد الكل
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={pros}
                        onChange={(e) => setPros(e.target.value)}
                        placeholder="مثال: توفير وقت الكتابة عند استخدام دوال كثيرة..."
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-rose-300">
                        عيوب طريقة استيراد الكل
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={cons}
                        onChange={(e) => setCons(e.target.value)}
                        placeholder="مثال: زيادة حجم المقطع البرمجي وأعباء الصيانة والأمن..."
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2.5 text-sm text-slate-100 focus:outline-none focus:border-rose-400"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-colors"
                  >
                    {compareSaved ? 'تم حفظ المقارنة لدى المعلمة!' : 'إرسال المقارنة للمعلمة'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeStation === 's3' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white">
                  03. مختبر استكشاف النظام والملفات: sys · os · dir()
                </h3>
                <p className="text-sm text-slate-300 mt-1">
                  اضغطي على الأوامر البرمجية أدناه لمحاكاة تنفيذها في بايثون ومراقبة مسار العمل والمخرجات.
                </p>
              </div>
              <button
                type="button"
                onClick={() => markStationCompleted('s3')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  isCompleted('s3')
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                }`}
              >
                {isCompleted('s3') ? 'تم إتقان المحطة 3' : 'تأكيد إكمال المحطة 3'}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-3">
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                  <div className="text-xs font-bold text-cyan-300">أوامر نموذج sys البرمجي</div>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => runOsCommand('version')}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-100 transition-colors"
                    >
                      <span>عرض نسخة بايثون</span>
                      <code className="text-cyan-300">sys.version</code>
                    </button>
                    <button
                      type="button"
                      onClick={() => runOsCommand('path')}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-100 transition-colors"
                    >
                      <span>عرض مسار الحزم القياسية</span>
                      <code className="text-cyan-300">sys.path</code>
                    </button>
                    <button
                      type="button"
                      onClick={() => runOsCommand('platform')}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-100 transition-colors"
                    >
                      <span>تحديد هوية نظام التشغيل</span>
                      <code className="text-cyan-300">sys.platform</code>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                  <div className="text-xs font-bold text-emerald-300">أوامر نموذج os ودالة dir()</div>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => runOsCommand('getcwd')}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-100 transition-colors"
                    >
                      <span>معرفة مسار المجلد الحالي</span>
                      <code className="text-emerald-300">os.getcwd()</code>
                    </button>
                    <button
                      type="button"
                      onClick={() => runOsCommand('chdir_desktop')}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-100 transition-colors"
                    >
                      <span>تغيير المسار إلى سطح المكتب</span>
                      <code className="text-emerald-300">os.chdir(...)</code>
                    </button>
                    <button
                      type="button"
                      onClick={() => runOsCommand('chdir_back')}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-100 transition-colors"
                    >
                      <span>العودة للمسار الأصلي</span>
                      <code className="text-emerald-300">os.chdir(&quot;..&quot;)</code>
                    </button>
                    <button
                      type="button"
                      onClick={() => runOsCommand('listdir')}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-100 transition-colors"
                    >
                      <span>عرض أسماء ملفات المجلد الحالي</span>
                      <code className="text-emerald-300">os.listdir()</code>
                    </button>
                    <button
                      type="button"
                      onClick={() => runOsCommand('dir_os')}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-100 transition-colors"
                    >
                      <span>فهرسة جميع دوال نموذج os</span>
                      <code className="text-amber-300">dir(os)</code>
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 flex flex-col gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>المجلد النشط حالياً:</span>
                  </div>
                  <code className="text-xs text-amber-300 truncate">{cwd}</code>
                </div>

                <div className="flex-1 rounded-xl bg-[#040811] border border-slate-800 p-4 font-mono text-xs space-y-3 min-h-[280px] max-h-[380px] overflow-y-auto">
                  <div className="flex items-center gap-2 text-slate-400 border-b border-slate-800/80 pb-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <span>Python Interactive Console (PyCharm Simulation)</span>
                  </div>
                  {terminalLogs.map((log, idx) => (
                    <div key={idx} className="space-y-1 border-b border-slate-900 pb-2">
                      <pre className="text-cyan-300 whitespace-pre-wrap">{`>>> ${log.cmd}`}</pre>
                      <pre className="text-emerald-300 whitespace-pre-wrap">{log.out}</pre>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeStation === 's4' && (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white">
                  04. مختبر نموذج math والواجهات الرسومية tkinter
                </h3>
                <p className="text-sm text-slate-300 mt-1">
                  حركي القيم لاختبار الدوال المثلثية، الأسس، الجذور، والتقريب، ثم حلي تحدي الكتاب (-3.4).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-4">
                <div className="p-5 rounded-xl bg-slate-950/75 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                      <Sliders className="w-4 h-4" />
                      <span>الزاوية والدوال المثلثية (math.radians / sin / cos / tan)</span>
                    </div>
                    <span className="text-sm font-mono text-amber-300 tabular-nums">{angleDeg}°</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    step={15}
                    value={angleDeg}
                    onChange={(e) => setAngleDeg(Number(e.target.value))}
                    aria-label="الزاوية بالتقدير الستيني"
                    className="w-full accent-cyan-400"
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-slate-400">radians({angleDeg})</div>
                      <div className="text-cyan-300 mt-1 tabular-nums">{rad.toFixed(4)}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-slate-400">math.sin()</div>
                      <div className="text-emerald-300 mt-1 tabular-nums">{Math.sin(rad).toFixed(4)}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-slate-400">math.cos()</div>
                      <div className="text-emerald-300 mt-1 tabular-nums">{Math.cos(rad).toFixed(4)}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-slate-400">math.tan()</div>
                      <div className="text-emerald-300 mt-1 tabular-nums">
                        {Math.abs(Math.cos(rad)) < 1e-10 ? '∞' : Math.tan(rad).toFixed(4)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950/75 border border-slate-800 space-y-3">
                    <div className="text-xs font-bold text-slate-200">القوى والجذور واللوغاريتمات</div>
                    <div className="flex items-center gap-2 text-xs">
                      <label className="text-slate-400">pow(</label>
                      <input
                        type="number"
                        value={powBase}
                        onChange={(e) => setPowBase(Number(e.target.value))}
                        className="w-16 rounded bg-slate-900 border border-slate-700 px-2 py-1 text-center font-mono text-cyan-300"
                      />
                      <span className="text-slate-400">,</span>
                      <input
                        type="number"
                        value={powExp}
                        onChange={(e) => setPowExp(Number(e.target.value))}
                        className="w-16 rounded bg-slate-900 border border-slate-700 px-2 py-1 text-center font-mono text-cyan-300"
                      />
                      <span className="text-slate-400">) =</span>
                      <span className="font-mono text-emerald-300 tabular-nums">
                        {Math.pow(powBase, powExp).toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <label className="text-slate-400">sqrt(</label>
                      <input
                        type="number"
                        min={0}
                        value={sqrtVal}
                        onChange={(e) => setSqrtVal(Math.max(0, Number(e.target.value)))}
                        className="w-20 rounded bg-slate-900 border border-slate-700 px-2 py-1 text-center font-mono text-cyan-300"
                      />
                      <span className="text-slate-400">) =</span>
                      <span className="font-mono text-emerald-300 tabular-nums">
                        {Math.sqrt(sqrtVal).toFixed(4)}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-400 pt-1">
                      math.pi = <span className="text-cyan-300">3.1415926</span> · math.e ={' '}
                      <span className="text-cyan-300">2.7182818</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/75 border border-slate-800 space-y-3">
                    <div className="text-xs font-bold text-slate-200">التقريب ceil() و floor()</div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400">العدد:</span>
                      <input
                        type="number"
                        step="0.1"
                        value={roundVal}
                        onChange={(e) => setRoundVal(Number(e.target.value))}
                        className="w-28 rounded bg-slate-900 border border-slate-700 px-2 py-1 font-mono text-cyan-300"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="p-2 rounded bg-slate-900 border border-slate-800">
                        ceil: <span className="text-emerald-300">{Math.ceil(roundVal)}</span>
                      </div>
                      <div className="p-2 rounded bg-slate-900 border border-slate-800">
                        floor: <span className="text-amber-300">{Math.floor(roundVal)}</span>
                      </div>
                    </div>
                    <p className="text-xs text-rose-300">
                      تذكري: مع الأعداد السالبة، <code className="text-rose-200">floor(-10.1657) = -11</code>
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={handleCheckTryYourself}
                  className="p-5 rounded-xl bg-slate-950 border border-amber-500/40 space-y-3"
                >
                  <div className="text-sm font-bold text-amber-300">
                    نشاط الكتاب «جرب بنفسك» (ص 160): جربي الدالتين على الرقم 3.4-
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div>
                      <label className="block text-xs font-mono text-slate-300 mb-1">
                        math.ceil(-3.4)
                      </label>
                      <input
                        type="text"
                        required
                        value={ceilAns}
                        onChange={(e) => setCeilAns(e.target.value)}
                        placeholder="؟"
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm font-mono text-center text-white focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-slate-300 mb-1">
                        math.floor(-3.4)
                      </label>
                      <input
                        type="text"
                        required
                        value={floorAns}
                        onChange={(e) => setFloorAns(e.target.value)}
                        placeholder="؟"
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm font-mono text-center text-white focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="py-2 px-4 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm transition-colors"
                    >
                      تحقق وأرسل للمعلمة
                    </button>
                  </div>
                  {student.tryYourselfMath && (
                    <div
                      className={`text-xs font-semibold ${
                        student.tryYourselfMath.isCorrect ? 'text-emerald-300' : 'text-rose-300'
                      }`}
                    >
                      {student.tryYourselfMath.isCorrect
                        ? 'إجابة صحيحة! سقف -3.4 هو -3، وأرضيته هي -4.'
                        : 'حاولي مرة أخرى: فكري في خط الأعداد، العدد الأصغر من -3.4 هو -4 والأكبر هو -3.'}
                    </div>
                  )}
                </form>
              </div>

              <div className="lg:col-span-5 rounded-xl bg-slate-950/80 border border-slate-800 p-5 flex flex-col justify-between gap-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <Monitor className="w-5 h-5" />
                    <h4 className="text-base font-bold text-white">معاينة نموذج tkinter للواجهات</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    من الحالات التي يُستورد فيها كامل النموذج{' '}
                    <code className="text-cyan-300">from tkinter import *</code>. عدّلي عنوان وحجم النافذة وشاهديها مباشرة:
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">window.title</label>
                      <input
                        type="text"
                        value={tkTitle}
                        onChange={(e) => setTkTitle(e.target.value)}
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">العرض × الارتفاع</label>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          min={180}
                          max={360}
                          value={tkWidth}
                          onChange={(e) => setTkWidth(Number(e.target.value))}
                          className="w-1/2 rounded-lg bg-slate-900 border border-slate-700 px-2 py-2 text-center font-mono text-cyan-300"
                        />
                        <input
                          type="number"
                          min={100}
                          max={240}
                          value={tkHeight}
                          onChange={(e) => setTkHeight(Number(e.target.value))}
                          className="w-1/2 rounded-lg bg-slate-900 border border-slate-700 px-2 py-2 text-center font-mono text-cyan-300"
                        />
                      </div>
                    </div>
                  </div>
                  <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-cyan-300 overflow-x-auto">
                    <code>{`from tkinter import *\nwindow = Tk()\nwindow.title("${tkTitle}")\nwindow.geometry("${tkWidth}x${tkHeight}")\nwindow.mainloop()`}</code>
                  </pre>
                </div>

                <div className="flex justify-center py-2">
                  <div
                    className="rounded-lg bg-slate-200 text-slate-900 shadow-xl overflow-hidden border border-slate-400 transition-all"
                    style={{
                      width: `${Math.min(340, Math.max(180, tkWidth))}px`,
                      height: `${Math.min(200, Math.max(100, tkHeight))}px`,
                    }}
                  >
                    <div className="bg-white px-3 py-1.5 border-b border-slate-300 flex items-center justify-between text-xs font-sans">
                      <span className="truncate font-semibold">{tkTitle || 'Tk'}</span>
                      <span className="text-slate-500 font-mono">_ □ ×</span>
                    </div>
                    <div className="p-3 text-xs text-slate-600 text-center mt-4">
                      نافذة بايثون الرسومية ({tkWidth}×{tkHeight})
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeStation === 's5' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white">
                  05. نموذجا time و datetime وحساب ذكرى يوم التأسيس السعودي
                </h3>
                <p className="text-sm text-slate-300 mt-1">
                  تطبيق عملي مباشر على مثال الكتاب (ص 161–162) للتعامل مع الوقت والتواريخ والمناسبات الوطنية.
                </p>
              </div>
              <button
                type="button"
                onClick={() => markStationCompleted('s5')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  isCompleted('s5')
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                }`}
              >
                {isCompleted('s5') ? 'تم إتقان المحطة 5' : 'تأكيد إكمال المحطة 5'}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-4">
                <div className="p-4 rounded-xl bg-slate-950/75 border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                    <Clock className="w-4 h-4" />
                    <span>نموذج time البرمجي</span>
                  </div>
                  <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-cyan-300 overflow-x-auto">
                    <code>{`import time\nprint(time.strftime("%H:%M"), time.strftime("%A %p"))`}</code>
                  </pre>
                  <div className="p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/30 font-mono text-xs text-sky-200 tabular-nums">
                    المخرج الحي الآن: {new Date().toTimeString().slice(0, 5)}{' '}
                    {new Date().toLocaleDateString('en-US', { weekday: 'long' })}{' '}
                    {new Date().getHours() >= 12 ? 'PM' : 'AM'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/75 border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>سمات التاريخ (Attribute) في datetime</span>
                  </div>
                  <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-emerald-300 overflow-x-auto">
                    <code>{`import datetime\nprint(datetime.date.today().day)   # ${foundationCalc.day}\nprint(datetime.date.today().month) # ${foundationCalc.month}\nprint(datetime.date.today().year)  # ${foundationCalc.year}`}</code>
                  </pre>
                </div>
              </div>

              <div className="lg:col-span-7 p-5 rounded-xl bg-slate-950 border border-emerald-500/35 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-base font-bold text-emerald-300">
                      مثال الكتاب الوطني: حساب الأيام المتبقية لذكرى يوم التأسيس (22 فبراير)
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      جربي تاريخ الكتاب (2023-11-15) أو تاريخ اليوم الحقيقي لملاحظة عمل دالة <code className="text-cyan-300">replace()</code>.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSimDateStr('2023-11-15')}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200"
                    >
                      تاريخ الكتاب
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimDateStr(new Date().toISOString().slice(0, 10))}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-xs text-emerald-300"
                    >
                      تاريخ اليوم
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-xs text-slate-300">اختاري تاريخ اليوم المُحاكى:</label>
                  <input
                    type="date"
                    value={simDateStr}
                    onChange={(e) => setSimDateStr(e.target.value)}
                    className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs font-mono text-cyan-300"
                  />
                </div>

                <pre className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-cyan-300 overflow-x-auto leading-relaxed">
                  <code>{`from datetime import date\ntoday = date.today()  # ${foundationCalc.todayStr}\nfoundationDay = date(today.year, 2, 22)\nif foundationDay < today:\n    foundationDay = foundationDay.replace(year=today.year + 1)\ntime_to_foundationDay = foundationDay - today\nprint("Days left for the Foundation Day:", time_to_foundationDay.days)`}</code>
                </pre>

                <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/30 font-mono text-xs sm:text-sm text-sky-100 space-y-1">
                  <div>Today is: {foundationCalc.todayStr}</div>
                  <div>The Foundation day is on: {foundationCalc.foundationTarget}</div>
                  <div className="text-emerald-300 font-bold">
                    Days left for the Foundation Day: {foundationCalc.daysLeft}
                  </div>
                  {foundationCalc.replaced && (
                    <div className="text-xs font-sans text-amber-300 pt-1">
                      ملاحظة: لأن 22 فبراير في {foundationCalc.year} قد مضى، استبدلت دالة <code className="font-mono">replace()</code> السنة إلى {foundationCalc.year + 1}.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentFormative && (
          <div className="pt-6 border-t border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                <Play className="w-4 h-4" />
                <span>التقويم التكويني السريع للمحطة</span>
              </div>
              {formativeState && (
                <span
                  className={`text-xs font-bold ${
                    formativeState.isCorrect ? 'text-emerald-300' : 'text-amber-300'
                  }`}
                >
                  {formativeState.isCorrect ? 'إجابة صحيحة وموثقة لدى المعلمة' : 'راجعي الإجابة والتفسير أدناه'}
                </span>
              )}
            </div>

            <p className="text-base font-semibold text-white">{currentFormative.question}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentFormative.options.map((opt, idx) => {
                const chosen = formativeState?.selectedIndex === idx;
                const isRight = idx === currentFormative.correctIndex;
                let style = 'bg-slate-950 border-slate-800 text-slate-200 hover:border-cyan-500/50';
                if (formativeState) {
                  if (isRight) {
                    style = 'bg-emerald-500/15 border-emerald-500 text-emerald-200';
                  } else if (chosen) {
                    style = 'bg-rose-500/15 border-rose-500 text-rose-200';
                  }
                }
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      handleAnswerFormative(currentFormative.id, idx, currentFormative.correctIndex)
                    }
                    className={`p-3.5 rounded-xl border text-right text-sm font-medium transition-colors ${style}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {formativeState && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                <strong className="text-cyan-300">التغذية الراجعة: </strong>
                {currentFormative.explanation}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
