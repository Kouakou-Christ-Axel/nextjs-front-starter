/**
 * Shape of an error response body.
 *
 * The HTTP client is envelope-agnostic for *success* responses: it returns the
 * raw JSON typed as `T`, so each request describes the exact shape the backend
 * sends instead of assuming a `{ data }` wrapper that real backends rarely honor.
 *
 * Errors, on the other hand, are normalized here. `message` may be a string or a
 * string[] (NestJS/class-validator returns an array of validation messages).
 */
export interface IApiErrorBody {
  message?: string | string[];
  error?: string;
  statusCode?: number;
  errors?: Record<string, string[]>; // pour les validations
  [key: string]: unknown;
}
