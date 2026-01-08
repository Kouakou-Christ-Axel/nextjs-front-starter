import { ApiResponse } from '@/types/api';

export class ApiError<T = unknown> extends Error {
  status: number;
  body?: ApiResponse<T>;

  constructor(status: number, message: string, body?: ApiResponse<T>) {
    super(message);
    this.status = status;
    this.body = body;
  }
}
