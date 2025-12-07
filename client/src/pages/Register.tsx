import React from 'react';
import { RegisterForm } from '../components/forms/RegisterForm';
import { PageTransition } from '../components/ui/PageTransition';

export const Register: React.FC = () => {
  return (
    <PageTransition>
      <RegisterForm />
    </PageTransition>
  );
};