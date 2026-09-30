import { NextResponse, type NextRequest } from 'next/server';

import { AUTH_COOKIE_NAMES, PROTECTED_PATH_PATTERNS } from './config/auth';
import {
  buildLoginRedirectUrl,
  hasAuthCookie,
  isProtectedPath,
} from './middleware/auth-guard';
import { buildCsp, generateNonce } from './middleware/csp';

const isProd = process.env.NODE_ENV === 'production';

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    isProtectedPath(pathname, PROTECTED_PATH_PATTERNS) &&
    !hasAuthCookie(req.cookies, AUTH_COOKIE_NAMES)
  ) {
    return NextResponse.redirect(buildLoginRedirectUrl(req.nextUrl, pathname));
  }

  const nonce = generateNonce();
  const response = NextResponse.next();
  response.headers.set(
    'Content-Security-Policy-Report-Only',
    buildCsp({
      nonce,
      isProd,
      backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL,
    })
  );
  response.headers.set('x-nonce', nonce);

  return response;
}

export const config = {
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
};
