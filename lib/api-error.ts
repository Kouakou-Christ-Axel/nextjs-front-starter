import { IApiErrorBody } from '@/types/api';

export class ApiError extends Error {
  status: number;
  body?: IApiErrorBody;

  constructor(status: number, message: string, body?: IApiErrorBody) {
    super(message);
    this.status = status;
    this.body = body;
  }
}
