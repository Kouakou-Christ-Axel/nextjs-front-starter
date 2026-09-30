import React from 'react';
import { Loader2 } from 'lucide-react';

function PublicLoading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center justify-center">
        <Loader2 className="size-12 animate-spin" />
        <p>Chargement…</p>
      </div>
    </div>
  );
}

export default PublicLoading;
