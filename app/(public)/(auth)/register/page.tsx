import React from 'react';
import RegisterForm from '@/features/auth/components/register-form';

function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <RegisterForm />
    </div>
  );
}

export default RegisterPage;
