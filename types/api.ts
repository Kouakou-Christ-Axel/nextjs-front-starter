export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  errors?: Record<string, string[]>; // pour les validations
}
