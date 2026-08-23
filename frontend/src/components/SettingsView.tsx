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
  Download,
  Info,
  User,
  Terminal,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { 
  fetchSystemSettings, 
  saveSystemSettings, 
  resetApiKeyRotator, 
  SystemSettings, 
  SettingsTelemetry 
} from '../lib/api';

export const SettingsView: React.FC = () => {
  // Mode Selection: 'user' (User Preferences - clean & simple) vs 'developer' (Developer & Infrastructure)
  const [viewMode, setViewMode] = useState<'user' | 'developer'>('user');

  // Sub-Tab for Developer Mode
  const [activeDevSubTab, setActiveDevSubTab] = useState<'model' | 'gateway' | 'database'>('model');

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

  // Presets
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
      {/* Header Banner & Mode Switcher */}
      <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/80 ring-1 ring-white/50 shadow-[0_8px_32px_rgba(26,23,21,0.05)] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 backdrop-blur-md text-[#E8622C] text-xs font-bold uppercase tracking-wider mb-2 border border-white/70 shadow-2xs">
            <Sliders className="w-3.5 h-3.5" />
            <span>{viewMode === 'user' ? 'User Preferences' : 'Developer Infrastructure & Agent Rules'}</span>
          </div>
          <h1 className="font-didone font-bold text-2xl sm:text-3xl text-[#191715] tracking-tight">
            Settings & <span className="font-didone-italic text-[#E8622C] font-normal">{viewMode === 'user' ? 'Catalog Preferences' : 'Developer Control Panel'}</span>
          </h1>
          <p className="text-sm text-[#5C554D] mt-1 max-w-xl">
            {viewMode === 'user' 
              ? 'Customize catalog confidence thresholds, automated rules, notifications, and export tools for daily workflow.'
              : 'Configure low-level AI reasoning parameters, API gateway proxy endpoints, key rotator pool recovery, and database telemetry.'}
          </p>
        </div>

        {/* View Mode Toggle Pill + Save Button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center p-1 rounded-full bg-white/80 backdrop-blur-md border border-white/90 shadow-2xs">
            <button
              onClick={() => setViewMode('user')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'user'
                  ? 'bg-[#E8622C] text-white shadow-md shadow-[#E8622C]/25'
                  : 'text-[#5C554D] hover:text-[#191715]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>User Mode</span>
            </button>
            <button
              onClick={() => setViewMode('developer')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'developer'
                  ? 'bg-[#191715] text-white shadow-md'
                  : 'text-[#5C554D] hover:text-[#191715]'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-[#E8622C]" />
              <span>Developer Mode</span>
            </button>
          </div>

          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-full bg-gradient-to-r from-[#E8622C] to-[#D45320] hover:scale-[1.02] text-white text-xs font-bold shadow-md shadow-[#E8622C]/25 border border-white/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            {savedSuccess ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Save className="w-4 h-4" />}
            <span>{savedSuccess ? 'Saved' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* ── USER MODE: Clean, Simple, End-User Focused ────────────────────────────────────── */}
      {viewMode === 'user' && (
        <div className="space-y-6">
          {/* Section 1: Confidence & Catalog Rules */}
          <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/80 ring-1 ring-white/50 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/70 text-[#E8622C] flex items-center justify-center border border-white/80 shadow-2xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#191715]">Catalog Automation & Review Cutoffs</h3>
                  <p className="text-xs text-[#8C8276]">Control how extracted data is auto-committed vs escalated to human review</p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 bg-white/60 p-1 rounded-xl border border-white/70">
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
                  🎯 Standard
                </button>
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
                  Attributes extracted with confidence ≥ <strong>{autoCommitThreshold}%</strong> will instantly commit into the canonical product catalog.
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
                  Extracted values scored below <strong>{reviewThreshold}%</strong> are automatically escalated to your Review Queue for verification.
                </p>
              </div>
            </div>

            {/* Engineering Unit Normalization */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/50 border border-white/80">
              <div>
                <span className="text-xs font-bold text-[#191715] block">Strict Engineering Unit Normalization</span>
                <p className="text-[11px] text-[#8C8276] mt-0.5">Automatically standardizes units across datasheets (e.g. GPM to L/min, PSI to Bar)</p>
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

          {/* Section 2: Notifications & Workspace Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-6 sm:p-7 border border-white/80 ring-1 ring-white/50 shadow-sm space-y-5">
              <div className="flex items-center gap-2.5 pb-3 border-b border-white/60">
                <div className="w-8 h-8 rounded-xl bg-white/70 text-[#E8622C] flex items-center justify-center border border-white/80 shadow-2xs">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#191715]">Workspace Notifications</h3>
                  <p className="text-xs text-[#8C8276]">Conflict alerts & live background refresh</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/50 border border-white/80">
                  <div>
                    <span className="text-xs font-bold text-[#191715] block">Cross-Source Conflict Alerts</span>
                    <p className="text-[11px] text-[#8C8276] mt-0.5">Notify when datasheets disagree with existing catalog values</p>
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
                  <label className="text-xs font-bold text-[#191715]">Live Sync Interval</label>
                  <select
                    value={autoRefreshInterval}
                    onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                    className="w-full text-xs font-semibold bg-white/80 border border-white/90 rounded-2xl px-4 py-2.5 text-[#191715] focus:outline-none"
                  >
                    <option value={2}>⚡ Fast Sync (Every 2 Seconds)</option>
                    <option value={5}>🎯 Balanced Sync (Every 5 Seconds - Recommended)</option>
                    <option value={15}>🐢 Eco Sync (Every 15 Seconds)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Account Data Management */}
            <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-6 sm:p-7 border border-white/80 ring-1 ring-white/50 shadow-sm space-y-5">
              <div className="flex items-center gap-2.5 pb-3 border-b border-white/60">
                <div className="w-8 h-8 rounded-xl bg-white/70 text-[#E8622C] flex items-center justify-center border border-white/80 shadow-2xs">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#191715]">Data Export & Management</h3>
                  <p className="text-xs text-[#8C8276]">Download backups or clear catalog records</p>
                </div>
              </div>

              <div className="space-y-3">
                <a
                  href="/api/export/json"
                  download
                  className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-white/80 text-[#191715] text-xs font-bold border border-white/90 shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[#E8622C]" />
                  <span>Export Catalog Backup (JSON)</span>
                </a>

                <button
                  onClick={() => setShowClearConfirmModal(true)}
                  className="w-full py-3 px-4 rounded-2xl bg-[#FFF0ED] hover:bg-[#FFE0D9] text-[#D45320] text-xs font-bold border border-[#D45320]/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear My Account Catalog Data</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DEVELOPER MODE: Advanced Infrastructure, Models, Proxy & Telemetry ────────────── */}
      {viewMode === 'developer' && (
        <div className="space-y-6">
          {/* Sub-Tab Nav Bar for Developer Mode */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/80 shadow-2xs overflow-x-auto">
            <button
              onClick={() => setActiveDevSubTab('model')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeDevSubTab === 'model'
                  ? 'bg-[#191715] text-white shadow-md'
                  : 'text-[#5C554D] hover:text-[#191715] hover:bg-white/60'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-[#E8622C]" />
              <span>AI Engine & Key Pool</span>
            </button>

            <button
              onClick={() => setActiveDevSubTab('gateway')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeDevSubTab === 'gateway'
                  ? 'bg-[#191715] text-white shadow-md'
                  : 'text-[#5C554D] hover:text-[#191715] hover:bg-white/60'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-[#E8622C]" />
              <span>Gateway Proxy & Timeouts</span>
            </button>

            <button
              onClick={() => setActiveDevSubTab('database')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeDevSubTab === 'database'
                  ? 'bg-[#191715] text-white shadow-md'
                  : 'text-[#5C554D] hover:text-[#191715] hover:bg-white/60'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-[#E8622C]" />
              <span>SQLite Telemetry</span>
            </button>
          </div>

          {/* Dev Sub-Tab 1: AI Model & Key Pool */}
          {activeDevSubTab === 'model' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Model Selector */}
              <div className="lg:col-span-7 bg-white/70 backdrop-blur-2xl rounded-3xl p-6 sm:p-7 border border-white/80 ring-1 ring-white/50 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-white/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white/70 text-[#E8622C] flex items-center justify-center border border-white/80 shadow-2xs">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#191715]">Multimodal Extraction Model</h3>
                      <p className="text-xs text-[#8C8276]">Select underlying LLM model for extraction & agent tools</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label
                    onClick={() => setActiveModel('gemini-3.6-flash')}
                    className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      activeModel === 'gemini-3.6-flash'
                        ? 'border-[#E8622C] bg-white/90 shadow-md ring-1 ring-[#E8622C]/30'
                        : 'border-white/70 bg-white/50 hover:bg-white/70'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#191715]">Ledger AI Multimodal (Standard)</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20">
                          Production Standard
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
                        ? 'border-[#E8622C] bg-white/90 shadow-md ring-1 ring-[#E8622C]/30'
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

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/50 border border-white/80">
                  <div>
                    <span className="text-xs font-bold text-[#191715] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#E8622C]" />
                      Multi-Agent Self-Correction Loop
                    </span>
                    <p className="text-[11px] text-[#8C8276] mt-0.5">
                      Re-engages model with targeted audit feedback if confidence is below threshold
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

              {/* Key Pool Telemetry */}
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
                </div>

                <div className="p-4 rounded-2xl bg-white/60 border border-white/80 space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#8C8276]">Active Key Pool:</span>
                    <span className="font-bold text-[#191715]">{telemetry?.active_keys || 8} / {telemetry?.total_keys || 8} Active Keys</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8C8276]">429 Cooldown Timer:</span>
                    <span className="font-bold text-[#191715]">{telemetry?.rate_limit_cooldown_seconds || 60}s Recovery Window</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8C8276]">Rotation Policy:</span>
                    <span className="font-bold text-emerald-600">Round-Robin + Time Cooldown</span>
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
                  <span>Reset API Key Rotator Pool</span>
                </button>
              </div>
            </div>
          )}

          {/* Dev Sub-Tab 2: Gateway & Proxy */}
          {activeDevSubTab === 'gateway' && (
            <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/80 ring-1 ring-white/50 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/70 text-[#E8622C] flex items-center justify-center border border-white/80 shadow-2xs">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#191715]">Render Gateway Proxy Configuration</h3>
                    <p className="text-xs text-[#8C8276]">HTTP gateway fallback for complex image processing</p>
                  </div>
                </div>

                <span className="text-[11px] px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Render Proxy Endpoint Active
                </span>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#191715]">Proxy Endpoint URL</label>
                  <input
                    type="text"
                    value={proxyUrl}
                    onChange={(e) => setProxyUrl(e.target.value)}
                    className="w-full text-xs font-mono bg-white/80 border border-white/90 rounded-2xl px-4 py-3 text-[#191715] focus:outline-none focus:ring-2 focus:ring-[#E8622C]/40"
                    placeholder="https://free-api-erel.onrender.com/api/generate"
                  />
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
                </div>
              </div>
            </div>
          )}

          {/* Dev Sub-Tab 3: Database & Telemetry */}
          {activeDevSubTab === 'database' && (
            <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/80 ring-1 ring-white/50 shadow-sm space-y-6">
              <div className="flex items-center gap-2.5 pb-4 border-b border-white/60">
                <div className="w-8 h-8 rounded-xl bg-white/70 text-[#E8622C] flex items-center justify-center border border-white/80 shadow-2xs">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#191715]">SQLite Storage Telemetry</h3>
                  <p className="text-xs text-[#8C8276]">System environment & database path details</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white/60 border border-white/80 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#5C554D]">Database Path:</span>
                  <span className="font-mono font-semibold text-[#191715]">{telemetry?.database_path || 'sourceledger.db'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5C554D]">App Environment:</span>
                  <span className="font-bold text-[#191715] uppercase">{telemetry?.app_env || 'development'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5C554D]">User Products Count:</span>
                  <span className="font-bold text-[#191715]">{telemetry?.user_products_count ?? 0}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

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
