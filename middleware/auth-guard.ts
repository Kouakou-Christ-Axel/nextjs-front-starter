// Interface minimale dont le middleware a besoin (ISP — ne dépend pas de tout NextRequest).
type CookieStore = {
  get(name: string): { value: string } | undefined;
};

export function isProtectedPath(
  pathname: string,
  patterns: readonly RegExp[]
): boolean {
  return patterns.some((re) => re.test(pathname));
}

export function hasAuthCookie(
  cookies: CookieStore,
  allowedNames: ReadonlySet<string>
): boolean {
  for (const name of allowedNames) {
    const cookie = cookies.get(name);
    if (cookie && cookie.value.length > 0) return true;
  }
  return false;
}

export function extractLocale(
  pathname: string,
  locales: readonly string[],
  fallback: string
): string {
  const seg = pathname.split('/')[1];
  return locales.includes(seg) ? seg : fallback;
}

export function buildLoginRedirectUrl(
  reqUrl: URL,
  pathname: string,
  locales: readonly string[],
  defaultLocale: string
): URL {
  const locale = extractLocale(pathname, locales, defaultLocale);
  const url = new URL(reqUrl);
  url.pathname = `/${locale}/login`;
  url.search = '';
  return url;
}
