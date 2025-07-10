export class AppError extends Error {
  readonly statusCode: number;
  readonly isOpertaional: boolean;
  readonly detials?: any;
  constructor(
    message: string,
    statusCode: number,
    isOperational: boolean = true,
    detiails?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.detials = detiails;
    this.isOpertaional = isOperational;

    Error?.captureStackTrace(this);
  }
}

// not found error
export class NotFoundError extends AppError {
  constructor(message = "Resource Not found") {
    super(message, 404);
  }
}

// Validation error
export class ValidationError extends AppError {
  constructor(message = "Invalid Request data", detials?: any) {
    super(message, 400, true, detials);
  }
}

// Authentication error
export class AuthError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

// Forbidden error
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden Access") {
    super(message, 403);
  }
}

// Database error for mongodb /postgress
export class DatabaseError extends AppError {
  constructor(message = "Database Access", details?: any) {
    super(message, 500, true, details);
  }
}

// Rate limitter error
export class RatelimitterError extends AppError {
  constructor(message = "Too Many requestes Please try again later") {
    super(message, 429);
  }
}
