import React, { useState } from 'react';
import { Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { AuthCardLayout } from './AuthCardLayout';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export const ResetPasswordView: React.FC = () => {
  const { setAuthMode } = useAuth();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!password || !confirmPassword) {
      setErrorMsg('Please enter and confirm your new password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setIsSuccess(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCardLayout
      title="Create New Password"
      subtitle="Choose a strong new password for your SourceLedger account."
    >
      {errorMsg && (
        <div className="p-3 rounded-2xl bg-[#FFF0ED] border border-[#D45320]/20 text-[#D45320] text-xs flex items-center gap-2 animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isSuccess ? (
        <div className="space-y-4 text-center">
          <div className="p-4 rounded-2xl bg-[#1F8A53]/10 border border-[#1F8A53]/20 text-[#1F8A53] space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#1F8A53] text-white mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-[#191715]">Password Updated Successfully!</h3>
            <p className="text-xs text-[#5C554D]">
              Your password has been changed. You can now sign in with your new credentials.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setAuthMode('signin')}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#E8622C] to-[#D45320] text-white text-xs font-bold shadow-md shadow-[#E8622C]/25 hover:shadow-lg transition-all cursor-pointer"
          >
            Proceed to Sign In
          </button>
        </div>
      ) : (
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#191715]">New Password</label>
            <div className="relative flex items-center">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-white/70 text-[#191715] text-xs rounded-2xl py-2.5 pl-9 pr-4 border border-white/80 focus:border-[#E8622C] focus:ring-2 focus:ring-[#E8622C]/20 outline-hidden transition-all placeholder-[#8C8276]"
              />
              <Lock className="w-4 h-4 text-[#8C8276] absolute left-3 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#191715]">Confirm New Password</label>
            <div className="relative flex items-center">
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full bg-white/70 text-[#191715] text-xs rounded-2xl py-2.5 pl-9 pr-4 border border-white/80 focus:border-[#E8622C] focus:ring-2 focus:ring-[#E8622C]/20 outline-hidden transition-all placeholder-[#8C8276]"
              />
              <Lock className="w-4 h-4 text-[#8C8276] absolute left-3 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#E8622C] to-[#D45320] text-white text-xs font-bold shadow-md shadow-[#E8622C]/25 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Updating password...</span>
            ) : (
              <span>Update Password</span>
            )}
          </button>
        </form>
      )}
    </AuthCardLayout>
  );
};
