import React, { useState } from 'react';
import {
  BookOpen,
  Code2,
  GraduationCap,
  Layers,
  Terminal,
  UserCheck,
  Users,
} from 'lucide-react';
import { CLASSROOM_OPTIONS, type ClassroomName } from '../types';
import { LESSON_META } from '../data/lessonContent';

interface EntryGateProps {
  onStudentJoin: (name: string, classroom: ClassroomName) => Promise<void>;
  onTeacherJoin: (name: string, classroom: ClassroomName | 'الكل') => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
}

export const EntryGate: React.FC<EntryGateProps> = ({
  onStudentJoin,
  onTeacherJoin,
  isSubmitting,
  error,
}) => {
  const [activeTab, setActiveTab] = useState<'student' | 'teacher'>('student');
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState<ClassroomName>('3م / أ');

  const [teacherName, setTeacherName] = useState('أ. أسماء قيسي');
  const [teacherClass, setTeacherClass] = useState<ClassroomName | 'الكل'>('الكل');

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) return;
    await onStudentJoin(studentName.trim(), studentClass);
  };

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName.trim()) return;
    await onTeacherJoin(teacherName.trim(), teacherClass);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between py-10 px-4 sm:px-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center my-auto">
        <div className="lg:col-span-7 space-y-6">
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-cyan-300/90 font-medium">
            <span>{LESSON_META.subject}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>{LESSON_META.grade}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>{LESSON_META.unit}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight text-balance">
            المكتبات البرمجية في لغة بايثون
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
            رحلة تعليمية تفاعلية متكاملة عبر محطات التعلم الخمس، المختبرات البرمجية الحية،
            الاستراتيجيات النشطة، والربط بالقيم الإسلامية والوطنية لحساب ذكرى يوم التأسيس السعودي.
          </p>

          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/90 inline-block">
            <p className="text-sm sm:text-base font-semibold text-emerald-300">
              {LESSON_META.attribution}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {LESSON_META.pages} · بيئة التطبيق: {LESSON_META.tool}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <Terminal className="w-5 h-5 text-cyan-400 mb-2" />
              <div className="text-sm font-semibold text-slate-100">5 محطات تعلم</div>
              <div className="text-xs text-slate-400 mt-0.5">مختبر بايثون تفاعلي</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <Users className="w-5 h-5 text-emerald-400 mb-2" />
              <div className="text-sm font-semibold text-slate-100">استراتيجيات نشطة</div>
              <div className="text-xs text-slate-400 mt-0.5">فكر-زاوج-شارك ومقارنة</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <Layers className="w-5 h-5 text-amber-400 mb-2" />
              <div className="text-sm font-semibold text-slate-100">تقييمات شاملة</div>
              <div className="text-xs text-slate-400 mt-0.5">تكويني وختامي وأقران</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <Code2 className="w-5 h-5 text-sky-400 mb-2" />
              <div className="text-sm font-semibold text-slate-100">تزامن لحظي</div>
              <div className="text-xs text-slate-400 mt-0.5">ربط مباشر بلوحة المعلمة</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-7 shadow-2xl">
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-950/90 border border-slate-800 mb-6">
              <button
                type="button"
                onClick={() => setActiveTab('student')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                  activeTab === 'student'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <GraduationCap className="w-4 h-4 shrink-0" />
                <span>دخول الطالبة</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('teacher')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                  activeTab === 'teacher'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <UserCheck className="w-4 h-4 shrink-0" />
                <span>دخول المعلمة</span>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
                {error}
              </div>
            )}

            {activeTab === 'student' ? (
              <form onSubmit={handleStudentSubmit} className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-white">مرحباً بكِ يا مبرمجة المستقبل</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    أدخلي اسمكِ واختاري فصلكِ الدراسي لتظهر مشاركاتكِ مباشرة لدى معلمتكِ.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="student-name" className="block text-sm font-medium text-slate-200">
                    اسم الطالبة
                  </label>
                  <input
                    id="student-name"
                    type="text"
                    required
                    minLength={2}
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="مثال: سارة محمد القيسي"
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="student-class" className="block text-sm font-medium text-slate-200">
                    الفصل الدراسي
                  </label>
                  <select
                    id="student-class"
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value as ClassroomName)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-slate-100 focus:outline-none focus:border-cyan-400"
                  >
                    {CLASSROOM_OPTIONS.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || studentName.trim().length < 2}
                  className="w-full py-3.5 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-base transition-colors"
                >
                  {isSubmitting ? 'جاري تسجيل الدخول...' : 'دخول إلى الدرس التفاعلي'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleTeacherSubmit} className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-white">بوابة المعلمة وإدارة الصف</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    متابعة تفاعل الطالبات، التقييم بالفيسات والأيقونات، الاختيار العشوائي، وخطة الدرس.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="teacher-name" className="block text-sm font-medium text-slate-200">
                    اسم المعلمة
                  </label>
                  <input
                    id="teacher-name"
                    type="text"
                    required
                    minLength={2}
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    placeholder="أ. أسماء قيسي"
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="teacher-class" className="block text-sm font-medium text-slate-200">
                    الفصل المستهدف
                  </label>
                  <select
                    id="teacher-class"
                    value={teacherClass}
                    onChange={(e) => setTeacherClass(e.target.value as ClassroomName | 'الكل')}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-slate-100 focus:outline-none focus:border-emerald-400"
                  >
                    <option value="الكل">جميع الفصول (3م / أ - ب - ج)</option>
                    {CLASSROOM_OPTIONS.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || teacherName.trim().length < 2}
                  className="w-full py-3.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-base transition-colors"
                >
                  {isSubmitting ? 'جاري فتح اللوحة...' : 'فتح لوحة المعلمة الحية'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <footer className="mt-10 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span>{LESSON_META.attribution}</span>
        </div>
        <span>المنهج السعودي · المهارات الرقمية · الصف الثالث المتوسط</span>
      </footer>
    </div>
  );
};
