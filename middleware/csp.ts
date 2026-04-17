// Edge-compatible (no Node Buffer).
export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

type CspOptions = {
  nonce: string;
  isProd: boolean;
  backendUrl?: string;
};

export function buildCsp({ nonce, isProd, backendUrl }: CspOptions): string {
  const connect = ["'self'", backendUrl ?? ''].filter(Boolean).join(' ');
  const directives = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isProd ? '' : " 'unsafe-eval'"}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `font-src 'self' data:`,
    `connect-src ${connect}`,
    `frame-ancestors 'none'`,
    `form-action 'self'`,
    `base-uri 'self'`,
    `object-src 'none'`,
  ];
  if (isProd) directives.push('upgrade-insecure-requests');
  return directives.join('; ');
}
