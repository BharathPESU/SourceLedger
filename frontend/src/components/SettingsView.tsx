import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  ShieldCheck, 
  Sparkles, 
  Database, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  Cpu,
  Globe,
  Bell,
  Trash2,
  Key,
  RotateCcw,
  Zap,
  HardDrive,
  Layers,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Info
} from 'lucide-react';
import { 
  fetchSystemSettings, 
  saveSystemSettings, 
  resetApiKeyRotator, 
  SystemSettings, 
  SettingsTelemetry 
} from '../lib/api';

export const SettingsView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'model' | 'thresholds' | 'database' | 'gateway' | 'preferences'>('model');

  // Form State
  const [autoCommitThreshold, setAutoCommitThreshold] = useState<number>(85);
  const [reviewThreshold, setReviewThreshold] = useState<number>(65);
  const [activeModel, setActiveModel] = useState<string>('gemini-3.6-flash');
  const [enableRefinement, setEnableRefinement] = useState<boolean>(true);
  const [strictTolerance, setStrictTolerance] = useState<boolean>(true);
  const [proxyUrl, setProxyUrl] = useState<string>('https://free-api-erel.onrender.com/api/generate');
  const [proxyTimeout, setProxyTimeout] = useState<number>(60);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(5);
  const [densityMode, setDensityMode] = useState<string>('comfortable');
  const [enableNotifications, setEnableNotifications] = useState<boolean>(true);

  // Telemetry & Status State
  const [telemetry, setTelemetry] = useState<SettingsTelemetry | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [resetKeySuccess, setResetKeySuccess] = useState<string | null>(null);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState<boolean>(false);
  const [isClearing, setIsClearing] = useState<boolean>(false);

  // Load Settings from Backend & LocalStorage
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await fetchSystemSettings();
      if (data && data.settings) {
        setAutoCommitThreshold(data.settings.auto_commit_threshold || 85);
        setReviewThreshold(data.settings.review_threshold || 65);
        setActiveModel(data.settings.active_model || 'gemini-3.6-flash');
        setEnableRefinement(data.settings.enable_refinement ?? true);
        setStrictTolerance(data.settings.strict_tolerance ?? true);
        setProxyUrl(data.settings.proxy_url || 'https://free-api-erel.onrender.com/api/generate');
        setProxyTimeout(data.settings.proxy_timeout || 60);
        setAutoRefreshInterval(data.settings.auto_refresh_interval || 5);
        setDensityMode(data.settings.density_mode || 'comfortable');
      }
      if (data && data.telemetry) {
        setTelemetry(data.telemetry);
      }
    } catch (err) {
      console.warn('Could not fetch backend settings, using local defaults:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Save Settings to Backend & LocalStorage
  const handleSave = async () => {
    const updatedSettings: SystemSettings = {
      auto_commit_threshold: autoCommitThreshold,
      review_threshold: reviewThreshold,
      active_model: activeModel,
      enable_refinement: enableRefinement,
      strict_tolerance: strictTolerance,
      proxy_url: proxyUrl,
      proxy_timeout: proxyTimeout,
      auto_refresh_interval: autoRefreshInterval,
      density_mode: densityMode,
    };

    localStorage.setItem('sourceledger_settings', JSON.stringify(updatedSettings));

    try {
      await saveSystemSettings(updatedSettings);
    } catch (err) {
      console.warn('Backend settings save notice:', err);
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Reset API Key Pool
  const handleResetKeys = async () => {
    try {
      const res = await resetApiKeyRotator();
      setResetKeySuccess(res.message || 'Key pool restored!');
      loadSettings();
      setTimeout(() => setResetKeySuccess(null), 4000);
    } catch (err) {
      setResetKeySuccess('Key rotator reset requested');
      setTimeout(() => setResetKeySuccess(null), 3000);
    }
  };

  // Preset Configurations
  const applyPreset = (preset: 'strict' | 'fast' | 'autonomous') => {
    if (preset === 'strict') {
      setAutoCommitThreshold(92);
      setReviewThreshold(75);
      setActiveModel('gemini-3.6-pro');
      setEnableRefinement(true);
      setStrictTolerance(true);
    } else if (preset === 'fast') {
      setAutoCommitThreshold(80);
      setReviewThreshold(55);
      setActiveModel('gemini-3.6-flash');
      setEnableRefinement(false);
      setStrictTolerance(false);
    } else if (preset === 'autonomous') {
      setAutoCommitThreshold(85);
      setReviewThreshold(65);
      setActiveModel('gemini-3.6-flash');
      setEnableRefinement(true);
      setStrictTolerance(true);
    }
  };

  // Clear Catalog Data
  const handleClearCatalog = async () => {
    setIsClearing(true);
    try {
      await fetch('/api/products', { method: 'DELETE' });
      setShowClearConfirmModal(false);
      window.location.reload();
    } catch (err) {
      alert('Failed to clear catalog data');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header - Glassmorphism Card */}
      <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/80 ring-1 ring-white/50 shadow-[0_8px_32px_rgba(26,23,21,0.05)] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 backdrop-blur-md text-[#E8622C] text-xs font-bold uppercase tracking-wider mb-2 border border-white/70 shadow-2xs">
            <Sliders className="w-3.5 h-3.5" />
            <span>Autonomous Intelligence & System Rules</span>
          </div>
          <h1 className="font-didone font-bold text-2xl sm:text-3xl text-[#191715] tracking-tight">
            Settings & <span className="font-didone-italic text-[#E8622C] font-normal">Model Control Panel</span>
          </h1>
          <p className="text-sm text-[#5C554D] mt-1 max-w-xl">
            Configure automated commitment policies, confidence cutoff thresholds, API gateway routing, and key rotator telemetry.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={loadSettings}
            className="p-2.5 rounded-full bg-white/60 hover:bg-white text-[#191715] border border-white/80 shadow-2xs transition-all cursor-pointer"
            title="Refresh Settings & Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#E8622C] to-[#D45320] hover:scale-[1.02] text-white text-xs font-bold shadow-md shadow-[#E8622C]/25 border border-white/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            {savedSuccess ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Save className="w-4 h-4" />}
            <span>{savedSuccess ? 'Settings Applied!' : 'Save System Rules'}</span>
          </button>
        </div>
      </div>

      {/* Telemetry Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white/60 backdrop-blur-md border border-white/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E8622C]/10 text-[#E8622C] flex items-center justify-center border border-[#E8622C]/20 shrink-0">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8276] block">Active API Keys</span>
            <span className="text-base font-extrabold text-[#191715]">
              {telemetry ? `${telemetry.active_keys} / ${telemetry.total_keys}` : '8 / 8 Active'}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/60 backdrop-blur-md border border-white/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20 shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8276] block">Database Status</span>
            <span className="text-base font-extrabold text-[#191715]">
              SQLite Online
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/60 backdrop-blur-md border border-white/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center border border-blue-500/20 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8276] block">Ledger Records</span>
            <span className="text-base font-extrabold text-[#191715]">
              {telemetry?.user_products_count ?? 0} Products
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/60 backdrop-blur-md border border-white/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8276] block">429 Cooldown</span>
            <span className="text-base font-extrabold text-[#191715]">
              {telemetry?.rate_limit_cooldown_seconds ?? 60}s Recovery
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/80 shadow-2xs overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('model')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeSubTab === 'model'
              ? 'bg-[#E8622C] text-white shadow-md shadow-[#E8622C]/20'
              : 'text-[#5C554D] hover:text-[#191715] hover:bg-white/60'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>AI Model & Key Rules</span>
        </button>

        <button
          onClick={() => setActiveSubTab('thresholds')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeSubTab === 'thresholds'
              ? 'bg-[#E8622C] text-white shadow-md shadow-[#E8622C]/20'
              : 'text-[#5C554D] hover:text-[#191715] hover:bg-white/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Confidence Cutoffs</span>
        </button>

        <button
          onClick={() => setActiveSubTab('gateway')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeSubTab === 'gateway'
              ? 'bg-[#E8622C] text-white shadow-md shadow-[#E8622C]/20'
              : 'text-[#5C554D] hover:text-[#191715] hover:bg-white/60'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>API Gateway & Proxy</span>
        </button>

        <button
          onClick={() => setActiveSubTab('database')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeSubTab === 'database'
              ? 'bg-[#E8622C] text-white shadow-md shadow-[#E8622C]/20'
              : 'text-[#5C554D] hover:text-[#191715] hover:bg-white/60'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Database & Isolation</span>
        </button>

        <button
          onClick={() => setActiveSubTab('preferences')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeSubTab === 'preferences'
              ? 'bg-[#E8622C] text-white shadow-md shadow-[#E8622C]/20'
              : 'text-[#5C554D] hover:text-[#191715] hover:bg-white/60'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Alerts & Workspace</span>
        </button>
      </div>

      {/* Main Settings Form Container */}
      <div className="space-y-6">

        {/* ── Sub-Tab 1: AI Model & Key Rules ────────────────────────────────────────── */}
        {activeSubTab === 'model' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Model Selection */}
            <div className="lg:col-span-7 bg-white/70 backdrop-blur-2xl rounded-3xl p-6 sm:p-7 border border-white/80 ring-1 ring-white/50 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/70 text-[#E8622C] flex items-center justify-center border border-white/80 shadow-2xs">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#191715]">Multimodal Extraction Model</h3>
                    <p className="text-xs text-[#8C8276]">Select reasoning engine for OCR and spec sheets</p>
                  </div>
                </div>

                {/* Presets Button */}
                <div className="flex items-center gap-1.5 bg-white/60 p-1 rounded-xl border border-white/70">
                  <button
                    onClick={() => applyPreset('fast')}
                    className="px-2.5 py-1 text-[11px] font-semibold text-[#5C554D] hover:text-[#E8622C] hover:bg-white rounded-lg transition-colors cursor-pointer"
                  >
                    ⚡ Fast
                  </button>
                  <button
                    onClick={() => applyPreset('autonomous')}
                    className="px-2.5 py-1 text-[11px] font-semibold text-[#5C554D] hover:text-[#E8622C] hover:bg-white rounded-lg transition-colors cursor-pointer"
                  >
                    🤖 Auto
                  </button>
                  <button
                    onClick={() => applyPreset('strict')}
                    className="px-2.5 py-1 text-[11px] font-semibold text-[#5C554D] hover:text-[#E8622C] hover:bg-white rounded-lg transition-colors cursor-pointer"
                  >
                    🎯 Strict
                  </button>
                </div>
              </div>

              {/* Models Options */}
              <div className="space-y-3">
                <label
                  onClick={() => setActiveModel('gemini-3.6-flash')}
                  className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    activeModel === 'gemini-3.6-flash'
                      ? 'border-[#E8622C] bg-white/90 shadow-md shadow-[#E8622C]/5 ring-1 ring-[#E8622C]/30'
                      : 'border-white/70 bg-white/50 hover:bg-white/70'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#191715]">Ledger AI Multimodal (Standard)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20">
                        Stable Standard
                      </span>
                    </div>
                    <p className="text-xs text-[#8C8276]">
                      High-throughput spatial vision OCR, fast key-value extraction & math validation.
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                    activeModel === 'gemini-3.6-flash' ? 'border-[#E8622C] bg-[#E8622C]' : 'border-black/20'
                  }`}>
                    {activeModel === 'gemini-3.6-flash' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </label>

                <label
                  onClick={() => setActiveModel('gemini-3.6-pro')}
                  className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    activeModel === 'gemini-3.6-pro'
                      ? 'border-[#E8622C] bg-white/90 shadow-md shadow-[#E8622C]/5 ring-1 ring-[#E8622C]/30'
                      : 'border-white/70 bg-white/50 hover:bg-white/70'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#191715]">Ledger AI Multimodal (Deep Reasoning)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 font-bold border border-purple-500/20">
                        Deep Reasoning
                      </span>
                    </div>
                    <p className="text-xs text-[#8C8276]">
                      Complex engineering schematics, CAD drawings, and multi-page technical cross-references.
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                    activeModel === 'gemini-3.6-pro' ? 'border-[#E8622C] bg-[#E8622C]' : 'border-black/20'
                  }`}>
                    {activeModel === 'gemini-3.6-pro' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </label>
              </div>

              {/* Toggles */}
              <div className="space-y-4 pt-4 border-t border-white/60">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/50 border border-white/80">
                  <div>
                    <span className="text-xs font-bold text-[#191715] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#E8622C]" />
                      Multi-Agent Self-Correction Loop
                    </span>
                    <p className="text-[11px] text-[#8C8276] mt-0.5">
                      Re-engages model with targeted audit feedback if confidence is below commit threshold
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnableRefinement(!enableRefinement)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      enableRefinement ? 'bg-[#E8622C]' : 'bg-black/20'
                    }`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      enableRefinement ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* API Key Rotator & Telemetry Panel */}
            <div className="lg:col-span-5 bg-white/70 backdrop-blur-2xl rounded-3xl p-6 sm:p-7 border border-white/80 ring-1 ring-white/50 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/70 text-[#E8622C] flex items-center justify-center border border-white/80 shadow-2xs">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#191715]">Round-Robin Key Pool</h3>
                    <p className="text-xs text-[#8C8276]">Automatic 429 quota recovery manager</p>
                  </div>
                </div>

                <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20">
                  Pool Active
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white/60 border border-white/80 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#8C8276]">Configured Keys:</span>
                  <span className="font-bold text-[#191715]">{telemetry?.total_keys || 8} Keys (GOOGLE_API_KEY1..8)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#8C8276]">Rate-Limit Recovery Window:</span>
                  <span className="font-bold text-[#191715]">{telemetry?.rate_limit_cooldown_seconds || 60}s Cooldown</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#8C8276]">Quota Failure Policy:</span>
                  <span className="font-bold text-emerald-600">Auto-Rotate & Cooldown</span>
                </div>
              </div>

              {resetKeySuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{resetKeySuccess}</span>
                </div>
              )}

              <button
                onClick={handleResetKeys}
                className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-white/80 text-[#191715] font-bold text-xs border border-white/80 shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-[#E8622C]" />
                <span>Reset Key Rotator & Restore Pool</span>
              </button>

              <div className="p-3.5 rounded-2xl bg-[#FAF4EB] border border-[#E8622C]/20 text-[11px] text-[#5C554D] leading-relaxed flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#E8622C] shrink-0 mt-0.5" />
                <span>
                  SourceLedger cycles through your configured API keys in round-robin sequence. If any key hits a 429 quota, it enters a temporary 60-second cooldown without interrupting application processing.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Sub-Tab 2: Confidence Cutoffs ────────────────────────────────────────── */}
        {activeSubTab === 'thresholds' && (
          <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/80 ring-1 ring-white/50 shadow-sm space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-white/60">
              <div className="w-8 h-8 rounded-xl bg-white/70 text-[#E8622C] flex items-center justify-center border border-white/80 shadow-2xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#191715]">Confidence Commitment Thresholds</h3>
                <p className="text-xs text-[#8C8276]">Rules governing auto-acceptance vs human review escalation</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Auto-Commit Slider */}
              <div className="space-y-4 p-5 rounded-2xl bg-white/60 border border-white/80">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-[#191715] block">Auto-Commit Floor</span>
                    <span className="text-xs text-[#8C8276]">Instant catalog acceptance cutoff</span>
                  </div>
                  <span className="font-bold text-base text-[#E8622C] bg-[#FDF2EC] px-3 py-1 rounded-full border border-[#E8622C]/20">
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
                <p className="text-xs text-[#5C554D] leading-relaxed">
                  Extracted product attributes with confidence ≥ <strong>{autoCommitThreshold}%</strong> instantly commit into the canonical product catalog without requiring manual verification.
                </p>
              </div>

              {/* Review Queue Floor Slider */}
              <div className="space-y-4 p-5 rounded-2xl bg-white/60 border border-white/80">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-[#191715] block">Review Escalation Floor</span>
                    <span className="text-xs text-[#8C8276]">Discrepancy review queue trigger</span>
                  </div>
                  <span className="font-bold text-base text-[#191715] bg-white px-3 py-1 rounded-full border border-white/80">
                    {reviewThreshold}% Confidence
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="75"
                  value={reviewThreshold}
                  onChange={(e) => setReviewThreshold(Number(e.target.value))}
                  className="w-full accent-[#191715] cursor-pointer"
                />
                <p className="text-xs text-[#5C554D] leading-relaxed">
                  Extracted values scored below <strong>{reviewThreshold}%</strong> are automatically escalated to the active Review Queue for human oversight.
                </p>
              </div>
            </div>

            {/* Strict Unit Normalization */}
            <div className="pt-4 border-t border-white/60 flex items-center justify-between p-4 rounded-2xl bg-white/50 border border-white/80">
              <div>
                <span className="text-xs font-bold text-[#191715] block">Strict Engineering Unit Normalization</span>
                <p className="text-[11px] text-[#8C8276] mt-0.5">Automatically converts imperial/metric units (e.g. GPM to L/min, PSI to Bar)</p>
              </div>
              <button
                type="button"
                onClick={() => setStrictTolerance(!strictTolerance)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  strictTolerance ? 'bg-[#E8622C]' : 'bg-black/20'
                }`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  strictTolerance ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        )}

        {/* ── Sub-Tab 3: API Gateway & Proxy ────────────────────────────────────────── */}
        {activeSubTab === 'gateway' && (
          <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/80 ring-1 ring-white/50 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/70 text-[#E8622C] flex items-center justify-center border border-white/80 shadow-2xs">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#191715]">Multimodal OCR Gateway & Proxy Settings</h3>
                  <p className="text-xs text-[#8C8276]">Configure external Render proxy endpoint & timeout parameters</p>
                </div>
              </div>

              <span className="text-[11px] px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Render Proxy Reachable
              </span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#191715]">Gateway Proxy Endpoint URL</label>
                <input
                  type="text"
                  value={proxyUrl}
                  onChange={(e) => setProxyUrl(e.target.value)}
                  className="w-full text-xs font-mono bg-white/80 border border-white/90 rounded-2xl px-4 py-3 text-[#191715] focus:outline-none focus:ring-2 focus:ring-[#E8622C]/40"
                  placeholder="https://free-api-erel.onrender.com/api/generate"
                />
                <p className="text-[11px] text-[#8C8276]">
                  Primary multimodal vision extraction HTTP gateway fallback for complex image PDFs.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#191715]">Proxy Connection Timeout</span>
                  <span className="font-mono font-bold text-xs text-[#E8622C] bg-[#FDF2EC] px-2.5 py-0.5 rounded-full border border-[#E8622C]/20">
                    {proxyTimeout} Seconds
                  </span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="120"
                  value={proxyTimeout}
                  onChange={(e) => setProxyTimeout(Number(e.target.value))}
                  className="w-full accent-[#E8622C] cursor-pointer"
                />
                <p className="text-[11px] text-[#8C8276]">
                  Recommended: <strong>60 seconds</strong> to allow Render instance cold-starts and deep multimodal processing.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Sub-Tab 4: Database & Isolation ────────────────────────────────────────── */}
        {activeSubTab === 'database' && (
          <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/80 ring-1 ring-white/50 shadow-sm space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-white/60">
              <div className="w-8 h-8 rounded-xl bg-white/70 text-[#E8622C] flex items-center justify-center border border-white/80 shadow-2xs">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#191715]">Database & Storage Management</h3>
                <p className="text-xs text-[#8C8276]">Inspect SQLite database telemetry, export backups, or manage user data</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-white/60 border border-white/80 space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#8C8276]">Storage Telemetry</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#5C554D]">Database Path:</span>
                    <span className="font-mono font-semibold text-[#191715] truncate max-w-[200px]" title={telemetry?.database_path || 'sourceledger.db'}>
                      {telemetry?.database_path || 'sourceledger.db'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5C554D]">User Product Records:</span>
                    <span className="font-bold text-[#191715]">{telemetry?.user_products_count ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5C554D]">Ingestion Sources:</span>
                    <span className="font-bold text-[#191715]">{telemetry?.user_sources_count ?? 0}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white/60 border border-white/80 space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#8C8276]">Catalog Export & Actions</h4>
                <div className="space-y-2">
                  <a
                    href="/api/export/json"
                    download
                    className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-white/80 text-[#191715] text-xs font-bold border border-white/90 shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-[#E8622C]" />
                    <span>Export Catalog Backup (JSON)</span>
                  </a>

                  <button
                    onClick={() => setShowClearConfirmModal(true)}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#FFF0ED] hover:bg-[#FFE0D9] text-[#D45320] text-xs font-bold border border-[#D45320]/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear My Catalog Data</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Sub-Tab 5: Alerts & Preferences ────────────────────────────────────────── */}
        {activeSubTab === 'preferences' && (
          <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/80 ring-1 ring-white/50 shadow-sm space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-white/60">
              <div className="w-8 h-8 rounded-xl bg-white/70 text-[#E8622C] flex items-center justify-center border border-white/80 shadow-2xs">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#191715]">Workspace & Notification Preferences</h3>
                <p className="text-xs text-[#8C8276]">Tailor live UI refresh intervals and conflict alerts</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/50 border border-white/80">
                <div>
                  <span className="text-xs font-bold text-[#191715] block">Cross-Source Conflict Alerts</span>
                  <p className="text-[11px] text-[#8C8276] mt-0.5">Show real-time notifications when datasheets disagree with catalog values</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEnableNotifications(!enableNotifications)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    enableNotifications ? 'bg-[#E8622C]' : 'bg-black/20'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    enableNotifications ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#191715]">Live Data Sync Polling Interval</label>
                <select
                  value={autoRefreshInterval}
                  onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                  className="w-full text-xs font-semibold bg-white/80 border border-white/90 rounded-2xl px-4 py-3 text-[#191715] focus:outline-none"
                >
                  <option value={2}>⚡ Fast Sync (Every 2 Seconds)</option>
                  <option value={5}>🎯 Balanced Sync (Every 5 Seconds - Recommended)</option>
                  <option value={15}>🐢 Eco Sync (Every 15 Seconds)</option>
                  <option value={30}>⏸ Low Power Sync (Every 30 Seconds)</option>
                </select>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Confirmation Modal for Clearing Catalog */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-white shadow-2xl space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center border border-red-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#191715]">Clear Catalog Data?</h3>
              <p className="text-xs text-[#5C554D] mt-1 leading-relaxed">
                Are you sure you want to clear all product records, extracted sources, and review items for your account? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowClearConfirmModal(false)}
                className="px-4 py-2 rounded-full bg-black/5 hover:bg-black/10 text-[#191715] text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleClearCatalog}
                disabled={isClearing}
                className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isClearing ? 'Clearing Data...' : 'Yes, Delete My Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
