export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errors?: Record<string, string>[];

  constructor(
    statusCode: number,
    message: string,
    errors?: Record<string, string>[],
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg: string, errors?: Record<string, string>[]) {
    return new ApiError(400, msg, errors);
  }
  static unauthorized(msg = 'Unauthorized') {
    return new ApiError(401, msg);
  }
  static forbidden(msg = 'Forbidden') {
    return new ApiError(403, msg);
  }
  static notFound(msg = 'Resource not found') {
    return new ApiError(404, msg);
  }
  static conflict(msg: string) {
    return new ApiError(409, msg);
  }
  static tooMany(msg = 'Too many requests') {
    return new ApiError(429, msg);
  }
  static internal(msg = 'Internal server error') {
    return new ApiError(500, msg, undefined, false);
  }
}
