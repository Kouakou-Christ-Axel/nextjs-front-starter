import React from 'react';
import UserClientProvider from '@/components/providers/user-client-provider';

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <UserClientProvider>{children}</UserClientProvider>;
}

export default ProtectedLayout;
