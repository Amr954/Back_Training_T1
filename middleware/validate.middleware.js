const loggerEvent = require('../services/logger.service')
const logger = loggerEvent('auth')

const validate = (Schema, property ='body') => {
    return (req,res,next) =>{
        const {error} = Schema.validate(req[property],{abortEarly:false})
        if(error){
            const errMessage = error.details.map(errDetail => errDetail.message)
            logger.warn(errMessage)
            return res.status(400).json({
                message: "Validation error",
                error : errMessage
            })
        }
        next()
    };
}
module.exports = validate
