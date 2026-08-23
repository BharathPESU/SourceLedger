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

      <div className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
        
        {/* Left Panel: App Info & Marketing */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="hidden lg:flex flex-col justify-center col-span-7 pr-8"
        >
          <motion.div variants={fadeUp} className="flex items-center gap-4 mb-10">
            <div className="w-16 h-16 rounded-2xl bg-white/80 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/50">
              <img src="/logo.png" alt="SourceLedger Logo" className="w-12 h-12 object-contain" />
            </div>
            <h1 className="font-didone text-5xl font-bold tracking-tight text-[#191715] drop-shadow-sm">
              Source<span className="font-didone-italic text-[#E8622C] font-normal">Ledger</span>
            </h1>
          </motion.div>
          
          <motion.h2 variants={fadeUp} className="font-display text-[2.75rem] leading-[1.1] font-bold text-[#191715] mb-6 drop-shadow-sm">
            Autonomous Catalog <br/>
            <span className="text-[#E8622C]">Intelligence</span>
          </motion.h2>
          
          <motion.p variants={fadeUp} className="text-xl text-[#3A352F] mb-12 leading-relaxed max-w-lg drop-shadow-sm">
            Bridge the gap between unstructured manuals and structured ERP catalogs using multimodal AI agents.
          </motion.p>
          
          <div className="space-y-8">
            <motion.div variants={fadeUp} className="flex items-start gap-5">
              <div className="w-12 h-12 rounded-full bg-white/60 backdrop-blur-md flex items-center justify-center text-[#E8622C] shrink-0 border border-white/60 shadow-sm">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#191715] drop-shadow-sm">Instant Extraction</h3>
                <p className="text-base text-[#3A352F] mt-1 drop-shadow-sm">Automatically extract specs from PDFs, images, and technical sheets.</p>
              </div>
            </motion.div>
            
            <motion.div variants={fadeUp} className="flex items-start gap-5">
              <div className="w-12 h-12 rounded-full bg-white/60 backdrop-blur-md flex items-center justify-center text-[#E8622C] shrink-0 border border-white/60 shadow-sm">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#191715] drop-shadow-sm">Intelligent Deduplication</h3>
                <p className="text-base text-[#3A352F] mt-1 drop-shadow-sm">Cross-reference master data to prevent duplicates and resolve conflicts.</p>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="flex items-start gap-5">
              <div className="w-12 h-12 rounded-full bg-white/60 backdrop-blur-md flex items-center justify-center text-[#E8622C] shrink-0 border border-white/60 shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#191715] drop-shadow-sm">Enterprise Governance</h3>
                <p className="text-base text-[#3A352F] mt-1 drop-shadow-sm">End-to-end provenance tracking and human-in-the-loop review.</p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Panel: Auth Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md mx-auto col-span-5"
        >
          {/* Mobile Header (Hidden on Desktop) */}
          <div className="flex lg:hidden flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-white/80 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/50 mb-4">
              <img src="/logo.png" alt="SourceLedger Logo" className="w-12 h-12 object-contain" />
            </div>
            <h1 className="font-didone text-4xl font-bold tracking-tight text-[#191715]">
              Source<span className="font-didone-italic text-[#E8622C] font-normal">Ledger</span>
            </h1>
            <p className="text-sm text-[#5C554D] mt-2 font-medium">
              Autonomous Product Catalog Intelligence
            </p>
          </div>

          {/* Glassmorphic Auth Card */}
          <div className="w-full bg-white/80 backdrop-blur-3xl rounded-[2rem] border border-white ring-1 ring-black/5 shadow-[0_24px_64px_rgba(26,23,21,0.1)] p-8 sm:p-10 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#191715]">
                {title}
              </h2>
              <p className="text-sm sm:text-base text-[#5C554D] leading-relaxed">
                {subtitle}
              </p>
            </div>

            {children}
          </div>

          {/* Footer info */}
          <p className="text-xs text-center text-[#5C554D] mt-8 font-medium drop-shadow-sm">
            &copy; {new Date().getFullYear()} SourceLedger. Enterprise Catalog Governance.
          </p>
        </motion.div>
      </div>
    </div>
  );
};
