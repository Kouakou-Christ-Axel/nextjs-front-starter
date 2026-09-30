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

export function buildLoginRedirectUrl(reqUrl: URL, pathname: string): URL {
  const url = new URL(reqUrl);
  url.pathname = '/login';
  url.search = '';
  url.searchParams.set('returnTo', pathname);
  return url;
}
