'use client';
import React from 'react';

function PublicTemplate({ children }: { children: React.ReactNode }) {
  return <div className="slide-up">{children}</div>;
}

export default PublicTemplate;
