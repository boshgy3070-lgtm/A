import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  SkipBack,
  SkipForward,
  Sparkles,
  Target,
  Tv,
} from 'lucide-react';
import {
  CLASSROOM_RULES,
  LESSON_META,
  LESSON_OBJECTIVES,
  LESSON_VOCABULARY,
  VIDEO_SCENES,
} from '../data/lessonContent';

interface VideoIntroSectionProps {
  rulesAccepted: boolean;
  videoWatched: boolean;
  onAcceptRules: () => void;
  onMarkVideoWatched: () => void;
}

export const VideoIntroSection: React.FC<VideoIntroSectionProps> = ({
  rulesAccepted,
  videoWatched,
  onAcceptRules,
  onMarkVideoWatched,
}) => {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedInScene, setElapsedInScene] = useState(0);
  const [showYoutubeEmbed, setShowYoutubeEmbed] = useState(false);

  const currentScene = VIDEO_SCENES[sceneIndex];

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setElapsedInScene((prev) => {
        if (prev + 1 >= currentScene.durationSec) {
          if (sceneIndex < VIDEO_SCENES.length - 1) {
            setSceneIndex((idx) => idx + 1);
            return 0;
          } else {
            setIsPlaying(false);
            if (!videoWatched) {
              onMarkVideoWatched();
            }
            return currentScene.durationSec;
          }
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, sceneIndex, currentScene.durationSec, videoWatched, onMarkVideoWatched]);

  const handleSelectScene = (index: number) => {
    setSceneIndex(index);
    setElapsedInScene(0);
    if (index === VIDEO_SCENES.length - 1 && !videoWatched) {
      onMarkVideoWatched();
    }
  };

  const progressPct = Math.min(
    100,
    Math.round(
      ((sceneIndex + elapsedInScene / currentScene.durationSec) / VIDEO_SCENES.length) * 100
    )
  );

  return (
    <section id="intro" className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 rounded-2xl bg-slate-900/85 border border-slate-800 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Tv className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">المقدمة التشويقية للدرس (فيديو تفاعلي)</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowYoutubeEmbed((v) => !v)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors whitespace-nowrap"
              >
                {showYoutubeEmbed ? 'العودة للعرض التفاعلي' : 'عرض فيديو الدرس المرجعي'}
              </button>
              <a
                href={LESSON_META.youtubeReferenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-700 hover:border-cyan-500/50 text-cyan-300 transition-colors whitespace-nowrap"
              >
                <span>يوتيوب</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {showYoutubeEmbed ? (
            <div className="aspect-video w-full bg-slate-950">
              <iframe
                title="نموذج sys البرمجي ضمن المكتبة القياسية في بايثون"
                src="https://www.youtube.com/embed/PjaPZa0MZ-4"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="p-6 sm:p-8 bg-gradient-to-br from-slate-950 via-[#0A1428] to-slate-900 flex-1 flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-cyan-300 font-medium">
                  <span>{currentScene.badge}</span>
                  <span className="tabular-nums">
                    المشهد {sceneIndex + 1} من {VIDEO_SCENES.length}
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-white leading-snug">
                  {currentScene.title}
                </h3>

                <p className="text-slate-300 text-base leading-relaxed">
                  {currentScene.narration}
                </p>

                <pre className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-cyan-300 text-xs sm:text-sm overflow-x-auto leading-relaxed">
                  <code>{currentScene.codePreview}</code>
                </pre>
              </div>

              <div className="space-y-4">
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectScene(Math.max(0, sceneIndex - 1))}
                      disabled={sceneIndex === 0}
                      aria-label="المشهد السابق"
                      className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-100 transition-colors"
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPlaying((p) => !p)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-colors"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      <span>{isPlaying ? 'إيقاف مؤقت' : 'تشغيل المقدمة'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleSelectScene(Math.min(VIDEO_SCENES.length - 1, sceneIndex + 1))
                      }
                      disabled={sceneIndex === VIDEO_SCENES.length - 1}
                      aria-label="المشهد التالي"
                      className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-100 transition-colors"
                    >
                      <SkipBack className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPlaying(false);
                        setSceneIndex(0);
                        setElapsedInScene(0);
                      }}
                      aria-label="إعادة التشغيل"
                      className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={onMarkVideoWatched}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      videoWatched
                        ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{videoWatched ? 'تمت مشاهدة المقدمة' : 'تأكيد إتمام المقدمة'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 rounded-2xl bg-slate-900/85 border border-slate-800 p-5 sm:p-6 flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-300">
              <ShieldCheck className="w-5 h-5" />
              <h2 className="text-lg font-bold text-white">القوانين الصفية وميثاق الحصة</h2>
            </div>

            <div className="space-y-3">
              {CLASSROOM_RULES.map((rule, idx) => (
                <div
                  key={rule.id}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80"
                >
                  <div className="text-sm font-semibold text-slate-100">
                    {idx + 1}. {rule.title}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 leading-relaxed">{rule.detail}</div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={onAcceptRules}
            className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
              rulesAccepted
                ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{rulesAccepted ? 'تم التعهد بالالتزام بالقوانين الصفية' : 'أتعهد بالالتزام بالقوانين الصفية'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-2xl bg-slate-900/80 border border-slate-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-white">أهداف الدرس</h3>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {LESSON_OBJECTIVES.map((obj, idx) => (
              <li
                key={idx}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-sm text-slate-200 leading-relaxed"
              >
                <span className="text-cyan-400 font-bold ml-1.5 tabular-nums">0{idx + 1}.</span>
                {obj}
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-5 rounded-2xl bg-slate-900/80 border border-slate-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">مفردات الدرس والأداة</h3>
          </div>
          <div className="space-y-2.5">
            {LESSON_VOCABULARY.map((item) => (
              <div
                key={item.term}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-white">{item.term}</span>
                  <span className="text-xs font-mono text-cyan-300">{item.english}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.meaning}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
            <span>بيئة التطوير المعتمدة</span>
            <span className="font-mono text-emerald-300">{LESSON_META.tool}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
