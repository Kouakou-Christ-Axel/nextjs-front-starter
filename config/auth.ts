// Cookies posés par le backend d'auth. Source de vérité unique partagée
// entre le client API (filtre de forwarding) et le middleware (check de présence).
export const AUTH_COOKIE_NAMES = new Set<string>([
  'access_token',
  'refresh_token',
  'jwt',
  'session',
  'csrf-token',
  '__Host-access_token',
  '__Host-refresh_token',
  '__Host-psifi.x-csrf-token',
]);

// Patterns de routes qui nécessitent une authentification serveur.
// Les locales sont gérées par next-intl en amont (ex: /fr/dashboard, /en/dashboard).
export const PROTECTED_PATH_PATTERNS: RegExp[] = [
  /^\/(en|fr)\/dashboard(\/.*)?$/,
];
