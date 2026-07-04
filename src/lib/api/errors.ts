import { ApiErrorResponse } from "./types";

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string | null;
  readonly path?: string;

  constructor(
    message: string,
    status = 500,
    code?: string | null,
    path?: string,
  ) {
    super(message);

    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.path = path;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string, code?: string | null, path?: string) {
    super(message, 400, code, path);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

export class ConflictError extends ApiError {
  constructor(message = "Conflict") {
    super(message, 409);
  }
}

export class ValidationError extends ApiError {
  constructor(message = "Validation failed") {
    super(message, 422);
  }
}

export class TooManyRequestsError extends ApiError {
  constructor(message = "Too many requests") {
    super(message, 429);
  }
}

export class InternalServerError extends ApiError {
  constructor(message = "Internal server error") {
    super(message, 500);
  }
}

export class NetworkError extends ApiError {
  constructor(message = "Network error") {
    super(message, 0);
  }
}

export class TimeoutError extends ApiError {
  constructor(message = "Request timeout") {
    super(message, 408);
  }
}

export async function parseApiError(error: unknown): Promise<ApiError> {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return new TimeoutError();
  }

  if (error instanceof TypeError) {
    return new NetworkError(error.message);
  }

  if (error instanceof Response) {
    let payload: ApiErrorResponse | null = null;

    try {
      const json = await error.clone().json();
      payload = json.error ?? json;
    } catch {
      payload = null;
    }

    const message =
      payload?.message ||
      payload?.error ||
      `HTTP ${error.status}`;

    switch (error.status) {
      case 400:
        return new BadRequestError(message, payload?.code, payload?.path);

      case 401:
        return new UnauthorizedError(message);

      case 403:
        return new ForbiddenError(message);

      case 404:
        return new NotFoundError(message);

      case 409:
        return new ConflictError(message);

      case 422:
        return new ValidationError(message);

      case 429:
        return new TooManyRequestsError(message);

      default:
        return new InternalServerError(message);
    }
  }

  if (error instanceof Error) {
    return new ApiError(error.message);
  }

  return new ApiError("Unexpected error");
}