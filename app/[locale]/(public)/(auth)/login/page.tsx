import React, { Suspense } from 'react';
import LoginForm from '@/components/features/auth/login-form';

async function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

export default LoginPage;
