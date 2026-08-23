import React, { ReactNode } from 'react';
import { Zap, Search, ShieldCheck } from 'lucide-react';
import { BackgroundVideo } from '../BackgroundVideo';
import { motion } from 'framer-motion';

interface AuthCardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
};

export const AuthCardLayout: React.FC<AuthCardLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="relative min-h-screen w-full bg-[#F5E9D8] text-[#191715] flex items-center justify-center p-4 sm:p-6 lg:p-12 font-sans selection:bg-[#E8622C] selection:text-white overflow-hidden">
      {/* Abstract Background Animation */}
      <BackgroundVideo />

      {/* Unified Glassmorphic Window */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-5xl mx-auto bg-white/60 backdrop-blur-3xl rounded-[2.5rem] border border-white/80 ring-1 ring-black/5 shadow-[0_32px_64px_rgba(26,23,21,0.15)] overflow-hidden"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2">
          
          {/* Left Panel: App Info & Marketing */}
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="hidden lg:flex flex-col justify-between p-10 lg:p-14 border-r border-white/40 bg-gradient-to-br from-white/40 to-transparent"
          >
            <div>
              <motion.div variants={fadeUp} className="flex items-center gap-3 mb-12">
                <img src="/logo.png" alt="SourceLedger Logo" className="h-12 w-auto object-contain drop-shadow-sm" />
                <h1 className="font-didone text-4xl font-bold tracking-tight text-[#191715]">
                  Source<span className="font-didone-italic text-[#E8622C] font-normal">Ledger</span>
                </h1>
              </motion.div>
              
              <motion.h2 variants={fadeUp} className="font-display text-4xl leading-tight font-bold text-[#191715] mb-6">
                Autonomous Catalog <br/>
                <span className="text-[#E8622C]">Intelligence</span>
              </motion.h2>
              
              <motion.p variants={fadeUp} className="text-lg text-[#5C554D] mb-12 leading-relaxed">
                Bridge the gap between unstructured manuals and structured ERP catalogs using multimodal AI agents.
              </motion.p>
              
              <div className="space-y-8">
                <motion.div variants={fadeUp} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#E8622C] shrink-0 shadow-sm border border-white/80">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#191715]">Instant Extraction</h3>
                    <p className="text-sm text-[#5C554D] mt-1 leading-relaxed">Automatically extract specs from PDFs, images, and technical sheets.</p>
                  </div>
                </motion.div>
                
                <motion.div variants={fadeUp} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#E8622C] shrink-0 shadow-sm border border-white/80">
                    <Search className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#191715]">Intelligent Deduplication</h3>
                    <p className="text-sm text-[#5C554D] mt-1 leading-relaxed">Cross-reference master data to prevent duplicates and resolve conflicts.</p>
                  </div>
                </motion.div>

                <motion.div variants={fadeUp} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#E8622C] shrink-0 shadow-sm border border-white/80">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#191715]">Enterprise Governance</h3>
                    <p className="text-sm text-[#5C554D] mt-1 leading-relaxed">End-to-end provenance tracking and human-in-the-loop review.</p>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Empty footer space on left to balance the layout */}
            <div className="mt-12"></div>
          </motion.div>

          {/* Right Panel: Auth Container */}
          <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-14 bg-white/20">
            {/* Mobile Header (Hidden on Desktop) */}
            <div className="flex lg:hidden flex-col items-center text-center mb-8">
              <img src="/logo.png" alt="SourceLedger Logo" className="h-14 w-auto object-contain drop-shadow-sm mb-4" />
              <h1 className="font-didone text-4xl font-bold tracking-tight text-[#191715]">
                Source<span className="font-didone-italic text-[#E8622C] font-normal">Ledger</span>
              </h1>
              <p className="text-sm text-[#5C554D] mt-2 font-medium">
                Autonomous Product Catalog Intelligence
              </p>
            </div>

            <div className="w-full max-w-sm mx-auto space-y-8">
              <div className="text-center space-y-2">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#191715]">
                  {title}
                </h2>
                <p className="text-sm text-[#5C554D] leading-relaxed">
                  {subtitle}
                </p>
              </div>

              {children}
              
              <p className="text-xs text-center text-[#5C554D] pt-6 font-medium">
                &copy; {new Date().getFullYear()} SourceLedger.<br/>Enterprise Catalog Governance.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
