const AppError = require('../services/AppError.service')

const validate = (Schema, property = 'body') => {
    return (req, res, next) => {
        if (!req[property] || typeof req[property] !== 'object') {
            req[property] = {};
        }
        const { error, value } = Schema.validate(req[property], { abortEarly: false })
        if (error) {
            const errMessage = error.details.map(errDetail => errDetail.message)
            
            return next(new AppError(errMessage, 400))
        }
        req[property] = value
        next()
    };
}
module.exports = validate
