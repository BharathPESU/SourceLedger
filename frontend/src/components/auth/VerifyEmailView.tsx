import React, { useState } from 'react';
import { Mail, RefreshCw, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { AuthCardLayout } from './AuthCardLayout';
import { useAuth } from '../../context/AuthContext';

export const VerifyEmailView: React.FC = () => {
  const { user, unverifiedEmail, resendVerificationEmail, signOut, setAuthMode } = useAuth();

  const targetEmail = user?.email || unverifiedEmail || 'your email address';

  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  const handleResend = async () => {
    setResendStatus(null);
    setResendError(null);
    setIsResending(true);

    try {
      const { error } = await resendVerificationEmail(targetEmail);
      if (error) {
        setResendError(error.message);
      } else {
        setResendStatus(`Verification email resent to ${targetEmail}. Please check your inbox.`);
      }
    } catch (err: any) {
      setResendError(err.message || 'Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthCardLayout
      title="Verify Your Email Address"
      subtitle="Email confirmation is required before accessing SourceLedger catalog data."
    >
      <div className="space-y-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#E8622C]/10 text-[#E8622C] mx-auto flex items-center justify-center border border-[#E8622C]/20 shadow-xs">
          <Mail className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <p className="text-xs text-[#5C554D] leading-relaxed">
            We sent a verification email to:
          </p>
          <p className="text-sm font-bold text-[#191715] font-mono bg-white/60 py-1 px-3 rounded-xl inline-block border border-white/80">
            {targetEmail}
          </p>
        </div>

        <p className="text-xs text-[#8C8276] leading-relaxed">
          Please click the link inside your verification email to complete setup and activate full access.
        </p>

        {resendStatus && (
          <div className="p-3 rounded-2xl bg-[#1F8A53]/10 border border-[#1F8A53]/20 text-[#1F8A53] text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{resendStatus}</span>
          </div>
        )}

        {resendError && (
          <div className="p-3 rounded-2xl bg-[#FFF0ED] border border-[#D45320]/20 text-[#D45320] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{resendError}</span>
          </div>
        )}

        <div className="pt-2 space-y-2">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#E8622C] to-[#D45320] text-white text-xs font-bold shadow-md shadow-[#E8622C]/25 hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
            <span>{isResending ? 'Resending...' : 'Resend Verification Email'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              signOut();
              setAuthMode('signin');
            }}
            className="w-full py-2.5 px-4 rounded-2xl bg-white/60 hover:bg-white text-[#191715] text-xs font-bold border border-white/80 shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4 text-[#8C8276]" />
            <span>Return to Sign In</span>
          </button>
        </div>
      </div>
    </AuthCardLayout>
  );
};
