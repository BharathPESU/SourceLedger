import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BackgroundVideo } from './BackgroundVideo';
import { 
  ArrowRight, 
  FileText, 
  Bot, 
  ShieldCheck, 
  Database, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Zap, 
  Cpu, 
  GitBranch, 
  ExternalLink,
  Lock,
  ChevronRight,
  Sparkles,
  Activity,
  FileCheck
} from 'lucide-react';

interface LandingPageViewProps {
  onLogin: () => void;
}

// Sample industrial product data for the Signature Traceability Inspector
interface AttributeTrace {
  id: string;
  label: string;
  value: string;
  unit?: string;
  confidence: number;
  confidenceTier: 'high' | 'medium';
  trustTier: string;
  sourceDoc: string;
  pageRef: string;
  verbatimExcerpt: string;
  reasoning: string;
  agentUsed: string;
}

const TRACE_ATTRIBUTES: AttributeTrace[] = [
  {
    id: 'max_pressure',
    label: 'Max Operating Pressure',
    value: '16.4',
    unit: 'bar',
    confidence: 98,
    confidenceTier: 'high',
    trustTier: 'Tier 1 OEM Datasheet',
    sourceDoc: 'Grundfos_CR32_SpecSheet.pdf',
    pageRef: 'Page 3, Table 4.1 (Operating Envelope)',
    verbatimExcerpt: '"Maximum allowable working pressure: 16.4 bar @ 20°C ambient fluid temperature."',
    reasoning: 'Extracted directly from OEM Technical Table 4.1. Unit normalized from 1640 kPa to 16.4 bar via Pydantic validator.',
    agentUsed: 'ExtractionAgent + ValidationAgent'
  },
  {
    id: 'flow_rate',
    label: 'Nominal Flow Rate',
    value: '45.0',
    unit: 'm³/h',
    confidence: 96,
    confidenceTier: 'high',
    trustTier: 'Tier 1 OEM Datasheet',
    sourceDoc: 'Grundfos_CR32_SpecSheet.pdf',
    pageRef: 'Page 2, Section 3.2 (Performance Curve)',
    verbatimExcerpt: '"Q_nom: 45 m³/h at 2900 RPM duty point with standard 400V 3-phase motor."',
    reasoning: 'Duty point flow rate confirmed across 2 independent curves on page 2. High confidence match.',
    agentUsed: 'ExtractionAgent'
  },
  {
    id: 'body_material',
    label: 'Impeller & Body Material',
    value: 'AISI 316L Stainless Steel',
    confidence: 94,
    confidenceTier: 'high',
    trustTier: 'Tier 1 OEM Datasheet',
    sourceDoc: 'Grundfos_CR32_SpecSheet.pdf',
    pageRef: 'Page 5, Section 7 (Material Specification)',
    verbatimExcerpt: '"Wetted parts construction: Stainless steel EN 1.4401 / AISI 316L for high-corrosion chemical media."',
    reasoning: 'Standardized EN 1.4401 designation mapped to canonical UNSPSC material taxonomy AISI 316L.',
    agentUsed: 'EnrichmentAgent'
  },
  {
    id: 'part_number',
    label: 'Manufacturer Part Number',
    value: 'CR32-3-2 A-F-A-E-HQQE',
    confidence: 99,
    confidenceTier: 'high',
    trustTier: 'Tier 1 OEM Nameplate Image',
    sourceDoc: 'CR32_Nameplate_Scan_049.png',
    pageRef: 'Vision OCR Region [x: 120, y: 440, w: 320, h: 60]',
    verbatimExcerpt: '"MODEL: CR32-3-2 A-F-A-E-HQQE | SERIAL: 96501823-2026"',
    reasoning: 'Extracted via PyMuPDF high-res OCR vision scan. SHA-256 hash verified for document idempotency.',
    agentUsed: 'IngestionAgent + Ledger OCR'
  }
];

export const LandingPageView: React.FC<LandingPageViewProps> = ({ onLogin }) => {
  const [selectedAttrId, setSelectedAttrId] = useState<string>('max_pressure');

  const selectedAttr = TRACE_ATTRIBUTES.find(a => a.id === selectedAttrId) || TRACE_ATTRIBUTES[0];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed inset-0 h-full w-full bg-[#F5E9D8] text-[#191715] font-sans selection:bg-[#E8622C] selection:text-white overflow-y-auto overflow-x-hidden z-10 scroll-smooth">
      {/* Abstract Background Animation */}
      <BackgroundVideo />

      {/* Main Content Container */}
      <div className="relative z-10 w-full min-h-screen flex flex-col">
        
        {/* Top Navigation */}
        <header className="sticky top-0 z-50 w-full bg-[#F5E9D8]/80 backdrop-blur-xl border-b border-white/40 shadow-xs">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center overflow-hidden border border-white/80 shrink-0">
                <img src="/logo.png" alt="SourceLedger Logo" className="w-full h-full object-cover" />
              </div>
              <h1 className="font-didone text-2xl font-bold tracking-tight text-[#191715]">
                Source<span className="font-didone-italic text-[#E8622C] font-normal">Ledger</span>
              </h1>
            </div>

            {/* Nav Links (Desktop) */}
            <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#5C554D]">
              <button 
                onClick={() => scrollToSection('traceability')} 
                className="hover:text-[#E8622C] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8622C] rounded-md px-2 py-1 cursor-pointer"
              >
                Traceability
              </button>
              <button 
                onClick={() => scrollToSection('problem')} 
                className="hover:text-[#E8622C] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8622C] rounded-md px-2 py-1 cursor-pointer"
              >
                The Problem
              </button>
              <button 
                onClick={() => scrollToSection('pipeline')} 
                className="hover:text-[#E8622C] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8622C] rounded-md px-2 py-1 cursor-pointer"
              >
                5-Agent Pipeline
              </button>
              <button 
                onClick={() => scrollToSection('governance')} 
                className="hover:text-[#E8622C] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8622C] rounded-md px-2 py-1 cursor-pointer"
              >
                Trust & Governance
              </button>
            </nav>

            {/* Action Button */}
            <button 
              onClick={onLogin}
              className="px-6 py-2.5 rounded-full bg-[#141210] hover:bg-[#2A2521] text-white font-semibold text-sm transition-all duration-300 ease-out hover:scale-105 active:scale-95 shadow-md flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8622C] focus-visible:ring-offset-2"
            >
              Sign In
              <ArrowRight className="w-4 h-4 text-[#E8622C]" />
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <section aria-labelledby="hero-heading" className="w-full max-w-7xl mx-auto px-6 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur-md border border-white/70 shadow-xs mb-8">
              <span className="flex h-2.5 w-2.5 rounded-full bg-[#E8622C] animate-pulse"></span>
              <span className="text-xs sm:text-sm font-bold tracking-wide text-[#141210] uppercase">
                Autonomous Catalog Intelligence Engine
              </span>
            </div>

            {/* Main Headline */}
            <h1 id="hero-heading" className="font-didone text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.05] font-bold text-[#141210] mb-8 tracking-tight">
              Every product fact, <br className="hidden sm:block" />
              <span className="font-didone-italic text-[#E8622C] font-normal">ledgered back</span> to its source.
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-[#4A433B] mb-10 leading-relaxed max-w-2xl font-medium">
              Bridge the gap between raw spec sheets, manufacturer PDFs, and scanned nameplate images into standardized, commerce-ready ERP records with complete source provenance and 0–100% confidence scores.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
              <button 
                onClick={onLogin}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#E8622C] hover:bg-[#C84E1E] text-white font-bold text-lg shadow-[0_8px_32px_rgba(232,98,44,0.35)] transition-all duration-300 ease-out hover:scale-105 active:scale-95 flex items-center justify-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141210]"
              >
                Enter the Ledger
                <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => scrollToSection('traceability')}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/60 hover:bg-white/90 backdrop-blur-md border border-white/80 shadow-xs text-[#141210] font-bold text-lg transition-all duration-300 ease-out hover:scale-105 active:scale-95 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8622C] cursor-pointer"
              >
                Explore Traceability
              </button>
            </div>

            {/* HERO SIGNATURE PREVIEW: Mini Traceability Card */}
            <div className="w-full max-w-3xl bg-white/60 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-[0_20px_50px_rgba(26,23,21,0.1)] p-6 sm:p-8 text-left transition-all hover:shadow-[0_24px_60px_rgba(26,23,21,0.15)]">
              <div className="flex items-center justify-between mb-4 border-b border-white/60 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#E8622C]" />
                  <span className="text-xs font-bold font-mono tracking-wider text-[#141210] uppercase">
                    Live Field Citation Preview
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F3EB] text-[#2D5A3C] text-xs font-mono font-bold border border-[#2D5A3C]/20">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 98.4% Confidence
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                {/* Extracted Field */}
                <div className="p-4 rounded-2xl bg-white/80 border border-white/90 shadow-2xs">
                  <p className="text-xs font-mono font-semibold text-[#7C7368] uppercase">Extracted Attribute</p>
                  <p className="text-lg font-bold text-[#141210] mt-1">Max Pressure: <span className="text-[#E8622C]">16.4 bar</span></p>
                  <p className="text-xs text-[#5C554D] mt-1 font-mono">Pydantic Domain: <code className="text-[#141210]">industrial_pump</code></p>
                </div>

                {/* Citation Link Thread */}
                <div className="p-4 rounded-2xl bg-[#201D1A] text-white border border-white/10 shadow-2xs relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-[#E8622C] uppercase font-bold tracking-wider">Verbatim OEM Citation</span>
                    <span className="text-[10px] font-mono text-white/60">PyMuPDF p.3</span>
                  </div>
                  <p className="text-xs font-mono text-white/90 italic leading-relaxed">
                    "Maximum allowable working pressure: 16.4 bar @ 20°C"
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 1: THE INDUSTRIAL CATALOG PROBLEM */}
        <section id="problem" aria-labelledby="problem-heading" className="w-full max-w-7xl mx-auto px-6 py-20 border-t border-white/40">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold font-mono tracking-widest text-[#E8622C] uppercase">The Industrial Data Reality</span>
            <h2 id="problem-heading" className="font-didone text-4xl sm:text-5xl font-bold text-[#141210] mt-3 mb-6">
              Industrial catalog onboarding is broken by unverified data chaos.
            </h2>
            <p className="text-base sm:text-lg text-[#4A433B] leading-relaxed">
              Distributors process millions of complex technical listings from thousands of manufacturers. Generic AI enrichment tools silently hallucinate part numbers and specs. SourceLedger brings absolute explainability to every single field.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Artifact 1 */}
            <div className="p-8 rounded-[2rem] bg-white/40 backdrop-blur-xl border border-white/70 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#E8622C] shadow-2xs mb-6 border border-white">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#141210] mb-3">📄 Locked Spec Sheet Chaos</h3>
                <p className="text-sm text-[#5C554D] leading-relaxed mb-4">
                  Essential technical attributes are trapped inside multi-page PDFs, unsearchable scanned table cells, and low-res nameplate photos.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#201D1A]/5 border border-[#141210]/10 text-xs font-mono text-[#5C554D]">
                <span>Status:</span> <span className="text-red-700 font-bold">Unstructured PDF Scans</span>
              </div>
            </div>

            {/* Artifact 2 */}
            <div className="p-8 rounded-[2rem] bg-white/40 backdrop-blur-xl border border-white/70 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#E8622C] shadow-2xs mb-6 border border-white">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#141210] mb-3">📐 Multi-Source Disagreements</h3>
                <p className="text-sm text-[#5C554D] leading-relaxed mb-4">
                  OEM spec sheets, distributor listings, and marketplace pages frequently contradict each other on head pressure, thread pitch, and voltage.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#201D1A]/5 border border-[#141210]/10 text-xs font-mono text-[#5C554D]">
                <span>Status:</span> <span className="text-amber-700 font-bold">Conflicting Specs</span>
              </div>
            </div>

            {/* Artifact 3 */}
            <div className="p-8 rounded-[2rem] bg-white/40 backdrop-blur-xl border border-white/70 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#E8622C] shadow-2xs mb-6 border border-white">
                  <Bot className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#141210] mb-3">👻 Silent AI Hallucinations</h3>
                <p className="text-sm text-[#5C554D] leading-relaxed mb-4">
                  Standard LLM parsers invent non-existent part numbers and silently pick values without providing an audit trail or citation link.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#201D1A]/5 border border-[#141210]/10 text-xs font-mono text-[#5C554D]">
                <span>Status:</span> <span className="text-[#E8622C] font-bold">Solved by SourceLedger</span>
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 2: THE 5-AGENT PIPELINE */}
        <section id="pipeline" aria-labelledby="pipeline-heading" className="w-full max-w-7xl mx-auto px-6 py-24 border-t border-white/40">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold font-mono tracking-widest text-[#E8622C] uppercase">Pipeline Orchestration</span>
            <h2 id="pipeline-heading" className="font-didone text-4xl sm:text-5xl font-bold text-[#141210] mt-3 mb-6">
              Powered by five specialized AI agents.
            </h2>
            <p className="text-base sm:text-lg text-[#4A433B] leading-relaxed">
              Every document moves through a deterministic multi-agent pipeline with thread-safe multi-key API rotation to eliminate rate limits and maintain absolute precision.
            </p>
          </div>

          <div className="space-y-6 max-w-5xl mx-auto">
            
            {/* Step 1: IngestionAgent */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white/40 backdrop-blur-xl border border-white/70 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all hover:bg-white/60">
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-2xl bg-[#141210] text-white flex items-center justify-center shrink-0 font-mono font-bold text-lg shadow-sm">
                  01
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-[#141210]">Ingestion Agent</h3>
                    <code className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#141210]/10 text-[#141210] font-semibold">
                      IngestionAgent
                    </code>
                  </div>
                  <p className="text-sm text-[#4A433B] mt-2 leading-relaxed max-w-xl">
                    Parses PDFs, scanned images, web HTML, and bulk CSVs into high-resolution vision renders. Computes SHA-256 document content hashes to guarantee absolute idempotency.
                  </p>
                </div>
              </div>
              <div className="px-4 py-2 rounded-xl bg-[#201D1A] text-[#E8622C] font-mono text-xs font-bold border border-white/10 shrink-0">
                SHA-256 Hash Idempotent
              </div>
            </div>

            {/* Step 2: ExtractionAgent */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white/40 backdrop-blur-xl border border-white/70 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all hover:bg-white/60">
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-2xl bg-[#141210] text-white flex items-center justify-center shrink-0 font-mono font-bold text-lg shadow-sm">
                  02
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-[#141210]">Extraction Agent</h3>
                    <code className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#141210]/10 text-[#141210] font-semibold">
                      ExtractionAgent
                    </code>
                  </div>
                  <p className="text-sm text-[#4A433B] mt-2 leading-relaxed max-w-xl">
                    Executes domain-specific Pydantic v2 schema locking across 6 industrial domains (`industrial_pump`, `electrical_connector`, `safety_fastener`, `power_tool`, `home_appliance`, `generic`).
                  </p>
                </div>
              </div>
              <div className="px-4 py-2 rounded-xl bg-[#201D1A] text-[#E8622C] font-mono text-xs font-bold border border-white/10 shrink-0">
                Pydantic v2 Schema Locked
              </div>
            </div>

            {/* Step 3: EnrichmentAgent */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white/40 backdrop-blur-xl border border-white/70 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all hover:bg-white/60">
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-2xl bg-[#141210] text-white flex items-center justify-center shrink-0 font-mono font-bold text-lg shadow-sm">
                  03
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-[#141210]">Enrichment Agent</h3>
                    <code className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#141210]/10 text-[#141210] font-semibold">
                      EnrichmentAgent
                    </code>
                  </div>
                  <p className="text-sm text-[#4A433B] mt-2 leading-relaxed max-w-xl">
                    Fills missing technical gaps from secondary sources, normalizes unit anarchy (GPM to m³/h, HP to kW), and maps industrial taxonomy codes (UNSPSC / eCl@ss).
                  </p>
                </div>
              </div>
              <div className="px-4 py-2 rounded-xl bg-[#201D1A] text-[#E8622C] font-mono text-xs font-bold border border-white/10 shrink-0">
                UNSPSC Taxonomy Mapped
              </div>
            </div>

            {/* Step 4: ValidationAgent */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white/40 backdrop-blur-xl border border-white/70 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all hover:bg-white/60">
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-2xl bg-[#141210] text-white flex items-center justify-center shrink-0 font-mono font-bold text-lg shadow-sm">
                  04
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-[#141210]">Validation Agent</h3>
                    <code className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#141210]/10 text-[#141210] font-semibold">
                      ValidationAgent
                    </code>
                  </div>
                  <p className="text-sm text-[#4A433B] mt-2 leading-relaxed max-w-xl">
                    Calculates 0–100% field-level trust scores based on OEM vs Distributor source tier ranking. Automatically commits high-confidence items (≥80%) and routes low-confidence items to Human Review.
                  </p>
                </div>
              </div>
              <div className="px-4 py-2 rounded-xl bg-[#201D1A] text-[#E8622C] font-mono text-xs font-bold border border-white/10 shrink-0">
                Confidence Threshold Gate (80%)
              </div>
            </div>

            {/* Step 5: ExplainabilityLayer */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white/40 backdrop-blur-xl border border-white/70 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all hover:bg-white/60">
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-2xl bg-[#E8622C] text-white flex items-center justify-center shrink-0 font-mono font-bold text-lg shadow-sm">
                  05
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-[#141210]">Explainability Layer</h3>
                    <code className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#E8622C]/10 text-[#E8622C] font-semibold">
                      ExplainabilityLayer
                    </code>
                  </div>
                  <p className="text-sm text-[#4A433B] mt-2 leading-relaxed max-w-xl">
                    Annotates every attribute with verbatim text quotes, page/table citations, and transparent AI reasoning chains without mutating data.
                  </p>
                </div>
              </div>
              <div className="px-4 py-2 rounded-xl bg-[#201D1A] text-[#E8622C] font-mono text-xs font-bold border border-white/10 shrink-0">
                Verbatim Source Ledgered
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 3: SIGNATURE ELEMENT — INTERACTIVE TRACEABILITY THREAD INSPECTOR */}
        <section id="traceability" aria-labelledby="traceability-heading" className="w-full max-w-7xl mx-auto px-6 py-24 border-t border-white/40">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold font-mono tracking-widest text-[#E8622C] uppercase">Signature Feature</span>
            <h2 id="traceability-heading" className="font-didone text-4xl sm:text-5xl font-bold text-[#141210] mt-3 mb-6">
              Interactive Traceability Inspector
            </h2>
            <p className="text-base sm:text-lg text-[#4A433B] leading-relaxed">
              Click any attribute below to observe how SourceLedger stitches extracted product data directly back to its verbatim source datasheet excerpt and confidence reasoning.
            </p>
          </div>

          {/* Interactive Inspector Board */}
          <div className="w-full max-w-5xl mx-auto bg-white/60 backdrop-blur-3xl rounded-[2.5rem] border border-white/80 shadow-[0_24px_60px_rgba(26,23,21,0.12)] p-6 sm:p-10">
            
            {/* Top Selector Bar */}
            <div className="mb-8">
              <label className="text-xs font-mono font-bold text-[#5C554D] uppercase tracking-wider block mb-3">
                Select Attribute to Trace:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {TRACE_ATTRIBUTES.map(attr => (
                  <button
                    key={attr.id}
                    onClick={() => setSelectedAttrId(attr.id)}
                    className={`px-4 py-3 rounded-2xl text-left transition-all duration-200 border flex flex-col justify-between ${
                      selectedAttrId === attr.id
                        ? 'bg-[#141210] text-white border-[#141210] shadow-md ring-2 ring-[#E8622C]'
                        : 'bg-white/70 hover:bg-white text-[#141210] border-white/80 shadow-2xs'
                    } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8622C]`}
                  >
                    <span className="text-xs font-medium opacity-80 block truncate">{attr.label}</span>
                    <span className="text-sm font-bold mt-1 font-mono block truncate">
                      {attr.value} {attr.unit || ''}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Split View Inspection Window */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              
              {/* Left Column: Verbatim Source Excerpt */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#201D1A] text-white flex flex-col justify-between border border-white/10 relative overflow-hidden">
                <div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-[#E8622C]" />
                      <span className="text-xs font-mono font-bold text-[#E8622C] uppercase tracking-wider">
                        Source Document Excerpt
                      </span>
                    </div>
                    <span className="text-xs font-mono text-white/60">{selectedAttr.pageRef}</span>
                  </div>

                  <p className="text-xs font-mono text-white/60 mb-2">
                    Document: <span className="text-white font-bold">{selectedAttr.sourceDoc}</span>
                  </p>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 my-4">
                    <p className="text-sm sm:text-base font-mono text-white/95 italic leading-relaxed">
                      {selectedAttr.verbatimExcerpt}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-white/60">
                  <span>Trust Tier: <strong className="text-white">{selectedAttr.trustTier}</strong></span>
                  <span>Agent: <strong className="text-[#E8622C]">{selectedAttr.agentUsed}</strong></span>
                </div>
              </div>

              {/* Right Column: Ledger Record & Confidence Reasoning */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white/80 border border-white shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-black/10 pb-4 mb-4">
                    <span className="text-xs font-mono font-bold text-[#5C554D] uppercase tracking-wider">
                      Catalog Attribute Record
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F3EB] text-[#2D5A3C] text-xs font-mono font-bold border border-[#2D5A3C]/20">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {selectedAttr.confidence}% Verified
                    </span>
                  </div>

                  <div className="mb-6">
                    <p className="text-xs font-mono text-[#5C554D] uppercase">{selectedAttr.label}</p>
                    <p className="text-2xl font-bold text-[#141210] mt-1 font-mono">
                      {selectedAttr.value} <span className="text-[#E8622C]">{selectedAttr.unit || ''}</span>
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F5E9D8]/60 border border-[#141210]/10">
                    <p className="text-xs font-mono font-bold text-[#141210] uppercase mb-1 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-[#E8622C]" /> LLM Reasoning Chain
                    </p>
                    <p className="text-xs text-[#4A433B] leading-relaxed">
                      {selectedAttr.reasoning}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-black/10 flex items-center justify-between text-xs font-mono text-[#5C554D]">
                  <span>Status: <strong className="text-[#2D5A3C]">auto_committed</strong></span>
                  <span>Isolation: <strong className="text-[#141210]">User Scoped</strong></span>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* SECTION 4: TRUST, CONFLICT RESOLUTION & GOVERNANCE */}
        <section id="governance" aria-labelledby="governance-heading" className="w-full max-w-7xl mx-auto px-6 py-24 border-t border-white/40">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold font-mono tracking-widest text-[#E8622C] uppercase">Catalog Governance</span>
            <h2 id="governance-heading" className="font-didone text-4xl sm:text-5xl font-bold text-[#141210] mt-3 mb-6">
              When sources disagree, we don't guess — we ledger why.
            </h2>
            <p className="text-base sm:text-lg text-[#4A433B] leading-relaxed">
              Catalog managers gain complete oversight. Cross-source conflicts are weighted by trust tier, and human corrections permanently log immutable `ReviewAction` audit records.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* Conflict Resolution Showcase */}
            <div className="p-8 rounded-[2.5rem] bg-white/40 backdrop-blur-xl border border-white/70 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#E8622C] shadow-2xs mb-6 border border-white">
                  <GitBranch className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-[#141210] mb-3">Multi-Source Conflict Resolution</h3>
                <p className="text-sm text-[#5C554D] leading-relaxed mb-6">
                  If an OEM datasheet specifies `16.4 bar` pressure while a distributor listing specifies `16.0 bar`, SourceLedger displays both values, weights OEM Tier 1 higher, and provides explicit justification.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-[#201D1A] text-white font-mono text-xs space-y-2">
                <div className="flex justify-between text-white/70">
                  <span>Tier 1 OEM Spec:</span> <span className="text-[#2D5A3C] font-bold">16.4 bar (Selected)</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>Tier 2 Distributor:</span> <span className="text-amber-500 font-bold">16.0 bar (Conflict Flagged)</span>
                </div>
              </div>
            </div>

            {/* Human in the Loop Queue */}
            <div className="p-8 rounded-[2.5rem] bg-white/40 backdrop-blur-xl border border-white/70 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#E8622C] shadow-2xs mb-6 border border-white">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-[#141210] mb-3">Human-in-the-Loop Review Queue</h3>
                <p className="text-sm text-[#5C554D] leading-relaxed mb-6">
                  Attributes with confidence below 80% route automatically to catalog engineers. Manual edits record immutable `ReviewAction` entries for complete enterprise compliance.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white/80 border border-white text-xs font-mono space-y-2 text-[#141210]">
                <div className="flex items-center justify-between">
                  <span>Audit Entry:</span> <span className="font-bold text-[#E8622C]">ReviewAction_0942</span>
                </div>
                <div className="flex items-center justify-between text-[#5C554D]">
                  <span>Action:</span> <span>Manual Verification & Approval</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* FINAL CTA & SYSTEM HEALTH */}
        <section aria-labelledby="cta-heading" className="w-full max-w-7xl mx-auto px-6 py-24 border-t border-white/40 text-center">
          <div className="max-w-3xl mx-auto bg-white/50 backdrop-blur-3xl rounded-[2.5rem] border border-white/80 p-10 sm:p-16 shadow-[0_32px_64px_rgba(26,23,21,0.12)]">
            <h2 id="cta-heading" className="font-didone text-4xl sm:text-5xl font-bold text-[#141210] mb-6">
              Ready to eliminate catalog data opacity?
            </h2>
            <p className="text-lg text-[#4A433B] mb-10 leading-relaxed font-medium">
              Transform raw PDFs, technical datasheets, and scans into transparent, explainable catalog records today.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button 
                onClick={onLogin}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#E8622C] hover:bg-[#C84E1E] text-white font-bold text-lg shadow-[0_8px_32px_rgba(232,98,44,0.35)] transition-all duration-300 ease-out hover:scale-105 active:scale-95 flex items-center justify-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141210]"
              >
                Enter the Ledger
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* System Status Pill */}
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[#201D1A] text-white text-xs font-mono border border-white/10">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>8-Key Gemini Pool Active</span>
              <span className="text-white/30">•</span>
              <span>Pydantic Schema Engine Online</span>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full border-t border-white/40 py-8 text-center text-xs font-mono text-[#5C554D]">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>&copy; {new Date().getFullYear()} SourceLedger. Built for UniHack 2026.</p>
            <div className="flex items-center gap-6 text-[#141210] font-bold">
              <span>FastAPI</span>
              <span>React 18</span>
              <span>Pydantic v2</span>
              <span>Supabase Auth</span>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
};
