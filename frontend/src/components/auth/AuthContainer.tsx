import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SignInView } from './SignInView';
import { SignUpView } from './SignUpView';
import { ForgotPasswordView } from './ForgotPasswordView';
import { ResetPasswordView } from './ResetPasswordView';
import { VerifyEmailView } from './VerifyEmailView';

export const AuthContainer: React.FC = () => {
  const { authMode, setAuthMode } = useAuth();

  // Detect recovery or hash params in URL (e.g., password reset or OAuth callback)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      setAuthMode('reset_password');
    }
  }, [setAuthMode]);

  switch (authMode) {
    case 'signup':
      return <SignUpView />;
    case 'forgot_password':
      return <ForgotPasswordView />;
    case 'reset_password':
      return <ResetPasswordView />;
    case 'verify_email':
      return <VerifyEmailView />;
    case 'signin':
    default:
      return <SignInView />;
  }
};
