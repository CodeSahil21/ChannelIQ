import React from 'react';
import { LoginForm } from '../components/forms/LoginForm';
import { PageTransition } from '../components/ui/PageTransition';

export const Login: React.FC = () => {
  return (
    <PageTransition>
      <LoginForm />
    </PageTransition>
  );
};