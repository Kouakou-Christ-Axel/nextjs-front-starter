'use client';
import React from 'react';
import { useUser } from '@/lib/auth';
import { useRouter, usePathname } from '@/i18n/navigation';
import { ApiError } from '@/lib/api-error';

// TODO i18n: move these user-facing strings to the translation layer.
const LOADING_MESSAGE = 'Loading…';
const TRANSIENT_ERROR_MESSAGE =
  'Could not load your session. Please try again in a moment.';

function buildLoginRedirect(pathname: string | null): string {
  if (!pathname || pathname.startsWith('/login')) return '/login';
  return `/login?returnTo=${encodeURIComponent(pathname)}`;
}

function UserClientProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isLoading, isError, error } = useUser();

  // A 401 is a *confirmed* unauthenticated state. Any other error (network
  // blip, CORS preflight, 5xx) is transient — bouncing the user to login on a
  // flaky reload would be a worse bug than showing a retry message.
  const isAuthError = error instanceof ApiError && error.status === 401;
  const isTransientError = isError && !isAuthError;
  const needsRedirect = !isLoading && (isAuthError || (!isError && !user));

  React.useEffect(() => {
    if (needsRedirect) {
      router.replace(buildLoginRedirect(pathname));
    }
  }, [needsRedirect, pathname, router]);

  if (isLoading || needsRedirect) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {LOADING_MESSAGE}
      </div>
    );
  }

  if (isTransientError) {
    return (
      <div
        role="alert"
        className="flex min-h-screen items-center justify-center px-6 text-center text-sm text-muted-foreground"
      >
        {TRANSIENT_ERROR_MESSAGE}
      </div>
    );
  }

  return <>{children}</>;
}

export default UserClientProvider;
