import React from 'react';
import { ResetPasswordForm } from '../components/forms/ResetPasswordForm';
import { PageTransition } from '../components/ui/PageTransition';

export const ResetPassword: React.FC = () => {
  return (
    <PageTransition>
      <ResetPasswordForm />
    </PageTransition>
  );
};