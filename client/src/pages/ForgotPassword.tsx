import React from 'react';
import { ForgotPasswordForm } from '../components/forms/ForgotPasswordForm';
import { PageTransition } from '../components/ui/PageTransition';

export const ForgotPassword: React.FC = () => {
  return (
    <PageTransition>
      <ForgotPasswordForm />
    </PageTransition>
  );
};