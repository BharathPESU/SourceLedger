import React from 'react';
import { motion } from 'framer-motion';
import { BackgroundVideo } from './BackgroundVideo';
import { ArrowRight, FileText, Bot, ShieldCheck, Database, LayoutDashboard, Brain, Activity } from 'lucide-react';

interface LandingPageViewProps {
  onLogin: () => void;
}

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80, damping: 20 } }
};

export const LandingPageView: React.FC<LandingPageViewProps> = ({ onLogin }) => {
  return (
    <div className="relative min-h-screen w-full bg-[#F5E9D8] text-[#191715] font-sans selection:bg-[#E8622C] selection:text-white overflow-y-auto overflow-x-hidden">
      {/* Abstract Background Animation */}
      <BackgroundVideo />

      {/* Main Content Wrapper - ensures it sits above the video */}
      <div className="relative z-10 w-full min-h-screen flex flex-col">
        
        {/* Top Navigation */}
        <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center overflow-hidden border border-white/80">
              <img src="/logo.png" alt="SourceLedger Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="font-didone text-2xl font-bold tracking-tight text-[#191715]">
              Source<span className="font-didone-italic text-[#E8622C] font-normal">Ledger</span>
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <button 
              onClick={onLogin}
              className="px-6 py-2.5 rounded-full bg-white/40 hover:bg-white/60 backdrop-blur-md border border-white/60 shadow-sm text-[#191715] font-semibold text-sm transition-all duration-300 ease-out hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              Sign In
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </nav>

        {/* Hero Section */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-6 flex flex-col items-center justify-center text-center py-20 lg:py-32">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="max-w-4xl mx-auto flex flex-col items-center"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/30 backdrop-blur-md border border-white/50 shadow-sm mb-8">
              <span className="flex h-2 w-2 rounded-full bg-[#E8622C] animate-pulse"></span>
              <span className="text-sm font-semibold text-[#5C554D]">The Enterprise Catalog Intelligence Engine</span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.05] font-bold text-[#191715] mb-8 tracking-tight">
              Every product fact, <br className="hidden md:block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#E8622C] to-[#b34015]">ledgered back</span> to its source.
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg md:text-xl text-[#3A352F] mb-12 leading-relaxed max-w-2xl font-medium">
              Bridge the gap between unstructured manuals and structured ERP catalogs using multimodal AI agents. Confidence Scored. Source Cited. Human Reviewed.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center gap-4">
              <button 
                onClick={onLogin}
                className="px-8 py-4 rounded-full bg-[#E8622C] hover:bg-[#D55A28] text-white font-bold text-lg shadow-[0_8px_32px_rgba(232,98,44,0.3)] transition-all duration-300 ease-out hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                Enter the Ledger
                <ArrowRight className="w-5 h-5" />
              </button>
              <a href="#features" className="px-8 py-4 rounded-full bg-white/40 hover:bg-white/60 backdrop-blur-md border border-white/60 shadow-sm text-[#191715] font-bold text-lg transition-all duration-300 ease-out hover:scale-105 active:scale-95">
                Explore Features
              </a>
            </motion.div>
          </motion.div>
        </main>

        {/* Bento Box Features Grid */}
        <section id="features" className="w-full max-w-7xl mx-auto px-6 py-24">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[320px]"
          >
            {/* Feature 1: Wide Card */}
            <div className="md:col-span-2 relative group overflow-hidden rounded-[2.5rem] bg-white/30 backdrop-blur-2xl border border-white/50 shadow-lg p-10 flex flex-col justify-end transition-all hover:bg-white/40">
              <div className="absolute top-10 right-10 w-24 h-24 bg-white/50 rounded-full blur-3xl group-hover:bg-[#E8622C]/20 transition-all duration-500"></div>
              <div className="absolute top-8 right-8 w-16 h-16 rounded-2xl bg-white/80 backdrop-blur-md shadow-sm border border-white/80 flex items-center justify-center text-[#E8622C]">
                <FileText className="w-8 h-8" />
              </div>
              <div className="relative z-10">
                <h3 className="text-3xl font-bold text-[#191715] mb-3 font-display">Multi-Format Ingestion</h3>
                <p className="text-lg text-[#5C554D] max-w-md leading-relaxed">
                  Seamlessly extract deep specs from complex PDF specification sheets, scanned images, raw text, and legacy CSVs using state-of-the-art Multimodal Vision OCR.
                </p>
              </div>
            </div>

            {/* Feature 2: Square Card */}
            <div className="md:col-span-1 relative group overflow-hidden rounded-[2.5rem] bg-[#E8622C] border border-[#E8622C] shadow-lg p-10 flex flex-col justify-end text-white transition-all hover:brightness-105">
              <div className="absolute top-10 right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
              <div className="absolute top-8 right-8 w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md shadow-sm border border-white/30 flex items-center justify-center text-white">
                <Activity className="w-8 h-8" />
              </div>
              <div className="relative z-10">
                <h3 className="text-3xl font-bold mb-3 font-display">Confidence Scoring</h3>
                <p className="text-white/90 leading-relaxed text-lg">
                  0–100% field-level trust metrics with automated commit thresholds.
                </p>
              </div>
            </div>

            {/* Feature 3: Square Card */}
            <div className="md:col-span-1 relative group overflow-hidden rounded-[2.5rem] bg-white/30 backdrop-blur-2xl border border-white/50 shadow-lg p-10 flex flex-col justify-end transition-all hover:bg-white/40">
              <div className="absolute top-8 right-8 w-16 h-16 rounded-2xl bg-white/80 backdrop-blur-md shadow-sm border border-white/80 flex items-center justify-center text-[#191715]">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="relative z-10">
                <h3 className="text-3xl font-bold text-[#191715] mb-3 font-display">Enterprise Governance</h3>
                <p className="text-lg text-[#5C554D] leading-relaxed">
                  Immutable provenance tracking and a robust Human-in-the-loop review queue.
                </p>
              </div>
            </div>

            {/* Feature 4: Wide Card */}
            <div className="md:col-span-2 relative group overflow-hidden rounded-[2.5rem] bg-white/30 backdrop-blur-2xl border border-white/50 shadow-lg p-10 flex flex-col justify-end transition-all hover:bg-white/40">
              <div className="absolute top-10 right-10 w-24 h-24 bg-white/50 rounded-full blur-3xl group-hover:bg-[#E8622C]/20 transition-all duration-500"></div>
              <div className="absolute top-8 right-8 w-16 h-16 rounded-2xl bg-white/80 backdrop-blur-md shadow-sm border border-white/80 flex items-center justify-center text-[#E8622C]">
                <Bot className="w-8 h-8" />
              </div>
              <div className="relative z-10">
                <h3 className="text-3xl font-bold text-[#191715] mb-3 font-display">AI Catalog Copilot</h3>
                <p className="text-lg text-[#5C554D] max-w-md leading-relaxed">
                  A conversational multi-agent interface that dispatches tools, executes complex live queries, and resolves conflicts directly over your catalog data.
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="w-full mt-auto py-8 text-center">
          <p className="text-sm font-medium text-[#5C554D] drop-shadow-sm">
            &copy; {new Date().getFullYear()} SourceLedger. Built with ❤️ for UniHack 2026.
          </p>
        </footer>

      </div>
    </div>
  );
};
