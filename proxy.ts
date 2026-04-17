import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';

import { AUTH_COOKIE_NAMES, PROTECTED_PATH_PATTERNS } from './config/auth';
import { routing } from './i18n/routing';
import {
  buildLoginRedirectUrl,
  hasAuthCookie,
  isProtectedPath,
} from './middleware/auth-guard';
import { buildCsp, generateNonce } from './middleware/csp';

const intlMiddleware = createIntlMiddleware(routing);
const isProd = process.env.NODE_ENV === 'production';

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    isProtectedPath(pathname, PROTECTED_PATH_PATTERNS) &&
    !hasAuthCookie(req.cookies, AUTH_COOKIE_NAMES)
  ) {
    const url = buildLoginRedirectUrl(
      req.nextUrl,
      pathname,
      routing.locales,
      routing.defaultLocale
    );
    return NextResponse.redirect(url);
  }

  // next-intl's types import `next/server.js` which TS resolves as a distinct
  // module copy from `next/server`. The runtime is identical, so cast safely.
  const response = (
    intlMiddleware as unknown as (r: NextRequest) => NextResponse
  )(req);

  const nonce = generateNonce();
  const csp = buildCsp({
    nonce,
    isProd,
    backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL,
  });
  response.headers.set('Content-Security-Policy-Report-Only', csp);
  response.headers.set('x-nonce', nonce);

  return response;
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
};
