import React from 'react';
import { Loader2 } from 'lucide-react';

function PublicLoading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center justify-center">
        <Loader2 className="animate-spin size-12" />
        <p>Loading...</p>
      </div>
    </div>
  );
}

export default PublicLoading;
