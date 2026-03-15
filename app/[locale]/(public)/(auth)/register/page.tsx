import React from 'react';
import RegisterForm from '@/components/features/auth/register-form';

function RegisterPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <RegisterForm />
    </div>
  );
}

export default RegisterPage;
