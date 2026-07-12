const AppError = require('../services/AppError.service')

const errorHandler = (err, req, res, next) => {
    console.error(err)
    let errorMes = err

    // Invalid MongoDB ObjectId
    if (err.name === 'CastError') {
        errorMes = new AppError(`Resource not found with id: ${err.value}`, 404)
    }

    // Duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0]
        const value = err.keyValue[field]
        errorMes = new AppError(`${field} '${value}' already exists`, 400)
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors)
            .map((e) => e.message)
            .join(', ')
        errorMes = new AppError(message, 400)
    }

    // JWT invalid
    if (err.name === 'JsonWebTokenError') {
        errorMes = new AppError('Invalid token. Please login again.', 401)
    }

    // JWT expired
    if (err.name === 'TokenExpiredError') {
        errorMes = new AppError('Token expired. Please login again.', 401)
    }

    // Multer errors
    if (err.name === 'MulterError') {
        errorMes = new AppError(err.message, 400)
    }

    // JSON parse error
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        errorMes = new AppError('Invalid JSON payload', 400)
    }

    const statusCode = errorMes.statusCode || 500
    const isKnownError = errorMes.isOperational === true

    const message = (process.env.NODE_ENV === 'production' && !isKnownError)
        ? 'Something went wrong. Please try again later.'
        : (errorMes.message || 'Internal Server Error')

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    })
}

module.exports = errorHandler