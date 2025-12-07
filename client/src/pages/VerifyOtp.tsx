import React from 'react';
import { VerifyOtpForm } from '../components/forms/VerifyOtpForm';
import { PageTransition } from '../components/ui/PageTransition';

export const VerifyOtp: React.FC = () => {
  return (
    <PageTransition>
      <VerifyOtpForm />
    </PageTransition>
  );
};