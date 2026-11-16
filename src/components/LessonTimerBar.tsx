import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Clock,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
} from 'lucide-react';
import type { LessonTimerState } from '../types';

interface LessonTimerBarProps {
  role: 'student' | 'teacher';
  timerState: LessonTimerState;
  onControlTimer: (
    action: 'start' | 'pause' | 'reset' | 'adjust',
    deltaSeconds?: number
  ) => Promise<void>;
}

function formatMMSS(totalSec: number): string {
  const safe = Math.max(0, Math.floor(totalSec));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function getPhaseLabel(elapsedSeconds: number): string {
  const elapsedMin = elapsedSeconds / 60;
  if (elapsedMin < 6) return 'المرحلة 01 · التهيئة والفيديو والقوانين (6 د)';
  if (elapsedMin < 12) return 'المرحلة 02 · المحطة 1 وفكر-زاوج-شارك (6 د)';
  if (elapsedMin < 19) return 'المرحلة 03 · المحطة 2 والمقارنة والتكويني (7 د)';
  if (elapsedMin < 28) return 'المرحلة 04 · المحطة 3 و 4 التطبيقية (9 د)';
  if (elapsedMin < 34) return 'المرحلة 05 · المحطة 5 والمهمة الوطنية (6 د)';
  return 'المرحلة 06 · التقييم الختامي وبطاقة الخروج (6 د)';
}

export const LessonTimerBar: React.FC<LessonTimerBarProps> = ({
  role,
  timerState,
  onControlTimer,
}) => {
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  // Personal fallback timer for students when teacher hasn't started the shared timer
  const [localRunning, setLocalRunning] = useState(false);
  const [localRemaining, setLocalRemaining] = useState(40 * 60);

  const sharedIsActiveOrModified =
    timerState.isRunning || timerState.remainingSeconds !== timerState.durationSeconds;

  useEffect(() => {
    if (!timerState.isRunning) return;
    setLocalRunning(false);
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [timerState.isRunning]);

  useEffect(() => {
    if (!localRunning || sharedIsActiveOrModified) return;
    const interval = setInterval(() => {
      setLocalRemaining((prev) => {
        if (prev <= 1) {
          setLocalRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [localRunning, sharedIsActiveOrModified]);

  const sharedRemaining = useMemo(() => {
    if (!timerState.isRunning || !timerState.startedAt) {
      return timerState.remainingSeconds;
    }
    const elapsed = Math.floor((nowMs - timerState.startedAt) / 1000);
    return Math.max(0, timerState.remainingSeconds - elapsed);
  }, [timerState.isRunning, timerState.startedAt, timerState.remainingSeconds, nowMs]);

  const effectiveRemaining =
    role === 'student' && !sharedIsActiveOrModified ? localRemaining : sharedRemaining;
  const effectiveRunning =
    role === 'student' && !sharedIsActiveOrModified ? localRunning : timerState.isRunning;

  const duration = timerState.durationSeconds || 40 * 60;
  const elapsed = Math.max(0, duration - effectiveRemaining);
  const progressPct = Math.min(100, Math.max(0, (elapsed / duration) * 100));

  const isCritical = effectiveRemaining > 0 && effectiveRemaining <= 5 * 60;
  const isFinished = effectiveRemaining === 0;

  let statusText = 'جاهز للبدء (40 دقيقة)';
  let statusTone = 'text-cyan-300 border-slate-800';
  let barColor = 'bg-cyan-400';

  if (isFinished) {
    statusText = 'انتهى وقت الحصة';
    statusTone = 'text-rose-300 border-rose-500/40';
    barColor = 'bg-rose-500';
  } else if (isCritical && effectiveRunning) {
    statusText = 'الوقت الحرج: آخر 5 دقائق';
    statusTone = 'text-amber-300 border-amber-500/40';
    barColor = 'bg-amber-400';
  } else if (effectiveRunning) {
    statusText =
      role === 'student' && !sharedIsActiveOrModified
        ? 'مؤقت شخصي قيد التشغيل'
        : 'الحصة جارية (متزامن)';
    statusTone = 'text-emerald-300 border-emerald-500/35';
    barColor = 'bg-emerald-400';
  } else if (effectiveRemaining < duration) {
    statusText = 'متوقف مؤقتاً';
    statusTone = 'text-amber-300 border-amber-500/35';
    barColor = 'bg-amber-400';
  }

  return (
    <section
      aria-label="مؤقت الحصة التفاعلي"
      className={`rounded-2xl bg-slate-900/90 border p-4 sm:px-6 sm:py-4 space-y-3 no-print ${statusTone}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 shrink-0">
            {isCritical || isFinished ? (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            ) : (
              <Clock className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span>مؤقت الحصة التنازلي (40 دقيقة)</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>{statusText}</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">{getPhaseLabel(elapsed)}</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            className="px-4 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-2xl sm:text-3xl font-bold text-white tabular-nums tracking-wider"
            dir="ltr"
          >
            {formatMMSS(effectiveRemaining)}
          </div>

          {role === 'teacher' ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {effectiveRunning ? (
                <button
                  type="button"
                  onClick={() => onControlTimer('pause')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors whitespace-nowrap"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>إيقاف مؤقت</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onControlTimer('start')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors whitespace-nowrap"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>تشغيل للجميع</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onControlTimer('adjust', 60)}
                title="إضافة دقيقة"
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>1د</span>
              </button>

              <button
                type="button"
                onClick={() => onControlTimer('adjust', -60)}
                title="إنقاص دقيقة"
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors whitespace-nowrap"
              >
                <Minus className="w-3.5 h-3.5" />
                <span>1د</span>
              </button>

              <button
                type="button"
                onClick={() => onControlTimer('reset')}
                title="إعادة ضبط 40 دقيقة"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة 40:00</span>
              </button>
            </div>
          ) : (
            !sharedIsActiveOrModified && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setLocalRunning((r) => !r)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-200 text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  {localRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{localRunning ? 'إيقاف مؤقت' : 'مؤقت شخصي'}</span>
                </button>
                {localRemaining < 40 * 60 && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocalRunning(false);
                      setLocalRemaining(40 * 60);
                    }}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                    aria-label="إعادة ضبط المؤقت الشخصي"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )
          )}
        </div>
      </div>

      <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${barColor}`}
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </section>
  );
};
