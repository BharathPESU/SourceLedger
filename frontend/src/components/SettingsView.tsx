import React, { useState } from 'react';
import { 
  Sliders, 
  ShieldCheck, 
  Sparkles, 
  Database, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  SlidersHorizontal,
  Layers,
  Cpu
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [autoCommitThreshold, setAutoCommitThreshold] = useState<number>(85);
  const [reviewThreshold, setReviewThreshold] = useState<number>(65);
  const [activeModel, setActiveModel] = useState<string>('gemini-2.5-flash');
  const [strictTolerance, setStrictTolerance] = useState<boolean>(true);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header - Frosted Glass Card */}
      <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/80 ring-1 ring-white/50 shadow-[0_8px_32px_rgba(26,23,21,0.05)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 backdrop-blur-md text-[#E8622C] text-xs font-bold uppercase tracking-wider mb-2 border border-white/70 shadow-2xs">
            <Sliders className="w-3.5 h-3.5" />
            <span>Autonomous Intelligence Rules</span>
          </div>
          <h1 className="font-didone font-bold text-2xl sm:text-3xl text-[#191715] tracking-tight">
            Settings & <span className="font-didone-italic text-[#E8622C] font-normal">Model Thresholds</span>
          </h1>
          <p className="text-sm text-[#5C554D] mt-1 max-w-xl">
            Configure automated commitment policies, confidence cutoff thresholds, and Gemini multimodal reasoning parameters for catalog ingestion.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#E8622C] to-[#D45320] hover:scale-[1.02] text-white text-xs font-bold shadow-md shadow-[#E8622C]/25 border border-white/20 flex items-center gap-2 transition-all cursor-pointer"
        >
          {savedSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{savedSuccess ? 'Rules Saved' : 'Save Rules'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Confidence Scoring Thresholds - Frosted Glass Card */}
        <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-6 sm:p-7 border border-white/80 ring-1 ring-white/50 shadow-[0_8px_32px_rgba(26,23,21,0.04)] space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-white/60">
            <div className="w-8 h-8 rounded-xl bg-white/70 backdrop-blur-md text-[#E8622C] flex items-center justify-center border border-white/80 shadow-2xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-[#191715]">
                Confidence Commit Thresholds
              </h3>
              <p className="text-xs text-[#8C8276]">
                Rules governing auto-acceptance vs human review
              </p>
            </div>
          </div>

          {/* Auto-Commit Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#191715]">Auto-Commit Floor</span>
              <span className="font-display font-bold text-sm text-[#E8622C] bg-[#FDF2EC]/80 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-[#E8622C]/20 shadow-2xs">
                {autoCommitThreshold}% Confidence
              </span>
            </div>
            <input
              type="range"
              min="70"
              max="98"
              value={autoCommitThreshold}
              onChange={(e) => setAutoCommitThreshold(Number(e.target.value))}
              className="w-full accent-[#E8622C] cursor-pointer"
            />
            <p className="text-[11px] text-[#8C8276] leading-relaxed">
              Attributes extracted with confidence ≥ <strong>{autoCommitThreshold}%</strong> will instantly commit into the canonical product catalog without human intervention.
            </p>
          </div>

          {/* Review Queue Floor Slider */}
          <div className="space-y-2 pt-2 border-t border-white/60">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#191715]">Critical Conflict Floor</span>
              <span className="font-display font-bold text-sm text-[#262320] bg-white/60 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/70 shadow-2xs">
                {reviewThreshold}% Confidence
              </span>
            </div>
            <input
              type="range"
              min="40"
              max="75"
              value={reviewThreshold}
              onChange={(e) => setReviewThreshold(Number(e.target.value))}
              className="w-full accent-[#262320] cursor-pointer"
            />
            <p className="text-[11px] text-[#8C8276] leading-relaxed">
              Values scored below <strong>{reviewThreshold}%</strong> will be flagged as critical discrepancies and escalated for supplier verification.
            </p>
          </div>
        </div>

        {/* Card 2: AI Multimodal Engine Selection - Frosted Glass Card */}
        <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-6 sm:p-7 border border-white/80 ring-1 ring-white/50 shadow-[0_8px_32px_rgba(26,23,21,0.04)] space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-white/60">
            <div className="w-8 h-8 rounded-xl bg-white/70 backdrop-blur-md text-[#E8622C] flex items-center justify-center border border-white/80 shadow-2xs">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-[#191715]">
                Gemini Extraction Engine
              </h3>
              <p className="text-xs text-[#8C8276]">
                Multimodal OCR & reasoning model
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <label
              onClick={() => setActiveModel('gemini-2.5-flash')}
              className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                activeModel === 'gemini-2.5-flash'
                  ? 'border-[#E8622C]/60 bg-white/90 backdrop-blur-md shadow-2xs'
                  : 'border-white/70 bg-white/50 backdrop-blur-md hover:bg-white/70'
              }`}
            >
              <div>
                <span className="font-bold text-xs text-[#191715] block">
                  Gemini 2.5 Flash (Recommended)
                </span>
                <span className="text-[11px] text-[#8C8276]">
                  Ultra-fast multimodal spatial OCR & spec table parsing
                </span>
              </div>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                activeModel === 'gemini-2.5-flash' ? 'border-[#E8622C] bg-[#E8622C]' : 'border-white/80'
              }`}>
                {activeModel === 'gemini-2.5-flash' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </label>

            <label
              onClick={() => setActiveModel('gemini-2.5-pro')}
              className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                activeModel === 'gemini-2.5-pro'
                  ? 'border-[#E8622C]/60 bg-white/90 backdrop-blur-md shadow-2xs'
                  : 'border-white/70 bg-white/50 backdrop-blur-md hover:bg-white/70'
              }`}
            >
              <div>
                <span className="font-bold text-xs text-[#191715] block">
                  Gemini 2.5 Pro (Deep Cross-Reference)
                </span>
                <span className="text-[11px] text-[#8C8276]">
                  Complex CAD engineering drawings & multi-standard cross-verification
                </span>
              </div>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                activeModel === 'gemini-2.5-pro' ? 'border-[#E8622C] bg-[#E8622C]' : 'border-white/80'
              }`}>
                {activeModel === 'gemini-2.5-pro' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </label>
          </div>

          <div className="pt-2 border-t border-white/60 flex items-center justify-between">
            <span className="text-xs font-semibold text-[#191715]">
              Strict Engineering Unit Normalization
            </span>
            <input
              type="checkbox"
              checked={strictTolerance}
              onChange={(e) => setStrictTolerance(e.target.checked)}
              className="rounded text-[#E8622C] focus:ring-[#E8622C] cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
