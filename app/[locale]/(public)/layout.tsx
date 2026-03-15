import React, { Suspense } from 'react';
import PublicLoading from '@/app/[locale]/(public)/loading';

function PublicLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PublicLoading />}>{children}</Suspense>;
}

export default PublicLayout;
