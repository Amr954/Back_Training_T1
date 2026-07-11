// Custom error class for known, expected ("operational") errors —
// things like "not found", "not authorized", "validation failed" —
// as opposed to genuine bugs (typos, undefined variables, etc).
//
// Usage anywhere in a controller:
//   throw new AppError('Product not found', 404)
// or, matching the next(error) pattern already used across this project:
//   return next(new AppError('Product not found', 404))

class AppError extends Error {
    constructor(message, statusCode) {
        super(message)
        this.statusCode = statusCode
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
        this.isOperational = true

        // excludes the AppError constructor itself from the stack trace,
        // so the trace points to where YOU threw the error, not to this file
        Error.captureStackTrace(this, this.constructor)
    }
}

module.exports = AppError