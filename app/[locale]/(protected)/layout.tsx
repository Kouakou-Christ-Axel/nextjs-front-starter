import React from 'react';

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {children}
    </div>
  );
}

export default ProtectedLayout;