import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { AuthCardLayout } from './AuthCardLayout';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export const ForgotPasswordView: React.FC = () => {
  const { setAuthMode } = useAuth();
  
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const redirectTo = `${window.location.origin}`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setIsSent(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send reset link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCardLayout
      title="Reset Your Password"
      subtitle="Enter your account email to receive password recovery instructions."
    >
      {errorMsg && (
        <div className="p-3 rounded-2xl bg-[#FFF0ED] border border-[#D45320]/20 text-[#D45320] text-xs flex items-center gap-2 animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isSent ? (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#FAF4EB] border border-white text-[#191715] text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#1F8A53]/10 text-[#1F8A53] mx-auto flex items-center justify-center border border-[#1F8A53]/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-[#5C554D] leading-relaxed">
              If an account exists for <strong className="text-[#191715]">{email}</strong>, a password reset link has been sent.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setAuthMode('signin')}
            className="w-full py-2.5 px-4 rounded-2xl bg-[#191715] text-white text-xs font-bold transition-all hover:bg-black cursor-pointer flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Sign In</span>
          </button>
        </div>
      ) : (
        <form onSubmit={handleResetRequest} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#191715]">Email Address</label>
            <div className="relative flex items-center">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="engineer@company.com"
                className="w-full bg-white/70 text-[#191715] text-xs rounded-2xl py-2.5 pl-9 pr-4 border border-white/80 focus:border-[#E8622C] focus:ring-2 focus:ring-[#E8622C]/20 outline-hidden transition-all placeholder-[#8C8276]"
              />
              <Mail className="w-4 h-4 text-[#8C8276] absolute left-3 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#E8622C] to-[#D45320] text-white text-xs font-bold shadow-md shadow-[#E8622C]/25 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Sending reset link...</span>
            ) : (
              <span>Send Reset Link</span>
            )}
          </button>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => setAuthMode('signin')}
              className="text-xs font-bold text-[#8C8276] hover:text-[#191715] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
          </div>
        </form>
      )}
    </AuthCardLayout>
  );
};
