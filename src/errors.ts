export class WhatsUsernamesApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "WhatsUsernamesApiError";
    this.status = status;
    this.code = code;
  }
}
