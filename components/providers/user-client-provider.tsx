'use client';
import React from 'react';
import { useUser } from '@/lib/auth';
import { redirect, RedirectType } from 'next/navigation';

function UserClientProvider({ children }: { children: React.ReactNode }) {
  const {
    data: user,
    isLoading: isUserLoading,
    // isError: isUserError,
  } = useUser();

  if (!user && !isUserLoading) {
    redirect('/login', RedirectType.replace);
  }

  if (isUserLoading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}

export default UserClientProvider;
