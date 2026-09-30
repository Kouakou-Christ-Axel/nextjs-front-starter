'use client';

import React, { useEffect } from 'react';

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isDev = process.env.NODE_ENV !== 'production';

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          fontFamily:
            'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
          backgroundColor: '#ffffff',
          color: '#0f172a',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '28rem',
            border: '1px solid #e2e8f0',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          }}
        >
          <h1
            style={{
              margin: '0 0 0.5rem 0',
              fontSize: '1.125rem',
              fontWeight: 600,
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              margin: '0 0 1rem 0',
              fontSize: '0.875rem',
              color: '#64748b',
            }}
          >
            An unexpected error occurred. You can try again or go back home.
          </p>
          {isDev && (
            <pre
              style={{
                maxHeight: '12rem',
                overflow: 'auto',
                backgroundColor: '#f1f5f9',
                color: '#475569',
                padding: '0.75rem',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                whiteSpace: 'pre-wrap',
                marginBottom: '1rem',
              }}
            >
              {error.message}
              {error.digest ? `\n\ndigest: ${error.digest}` : null}
            </pre>
          )}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                backgroundColor: '#0f172a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.375rem',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => window.location.assign('/')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                border: '1px solid #e2e8f0',
                borderRadius: '0.375rem',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Back to home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
