// Custom error class for known, expected ("operational") errors —
// things like "not found", "not authorized", "validation failed" —
// as opposed to genuine bugs (typos, undefined variables, etc).

//   throw new AppError('Product not found', 404)
// or, matching the next(error) pattern already used across this project:
//   return next(new AppError('Product not found', 404))

class AppError extends Error {
    constructor(message, statusCode) {
        super(message)
        this.statusCode = statusCode
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
        this.isOperational = true
        Error.captureStackTrace(this, this.constructor)
    }
}

module.exports = AppError