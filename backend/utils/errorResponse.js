// Custom ErrorResponse class that extends standard Error
class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;

    // Capture stack trace away from constructor call
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ErrorResponse;
