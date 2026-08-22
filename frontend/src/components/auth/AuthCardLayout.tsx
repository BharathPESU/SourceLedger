import React, { ReactNode } from 'react';
import { Layers } from 'lucide-react';
import { BackgroundVideo } from '../BackgroundVideo';

interface AuthCardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export const AuthCardLayout: React.FC<AuthCardLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="relative min-h-screen w-full bg-[#F5E9D8] text-[#191715] flex flex-col items-center justify-center p-4 sm:p-6 font-sans selection:bg-[#E8622C] selection:text-white overflow-y-auto">
      {/* Abstract Background Animation */}
      <BackgroundVideo />

      <div className="relative z-10 w-full max-w-md my-auto">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#E8622C] flex items-center justify-center text-white shadow-lg shadow-[#E8622C]/30 mb-3 transition-transform hover:scale-105">
            <Layers className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h1 className="font-didone text-3xl font-bold tracking-tight text-[#191715]">
            Source<span className="font-didone-italic text-[#E8622C] font-normal">Ledger</span>
          </h1>
          <p className="text-xs text-[#8C8276] mt-1 font-medium">
            Autonomous Product Catalog Intelligence Engine
          </p>
        </div>

        {/* Glassmorphic Auth Card */}
        <div className="w-full bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/80 ring-1 ring-white/50 shadow-[0_16px_48px_rgba(26,23,21,0.08)] p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="font-display text-xl font-bold text-[#191715]">
              {title}
            </h2>
            <p className="text-xs text-[#5C554D] leading-relaxed">
              {subtitle}
            </p>
          </div>

          {children}
        </div>

        {/* Footer info */}
        <p className="text-[11px] text-center text-[#8C8276] mt-6">
          &copy; {new Date().getFullYear()} SourceLedger. Enterprise Catalog Governance & Provenance.
        </p>
      </div>
    </div>
  );
};
