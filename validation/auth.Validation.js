const {newUserSchema ,signInSchema} = require('../services/userValidation.service')
const loggerEvent = require('../services/logger.service')
const logger = loggerEvent('auth')


const newUserValidation = (req,res,next) => {
    try{
        let {error} = newUserSchema.validate(req.body)
        if(error){
            let errMess = error.details[0].message;
            logger.warn(errMess)
            return res.status(403).send({
                message : errMess
            })
        }
        next()
    }
    catch(error){
        return res.status(500).send({
            message : error.message
        })
    }
}

const loginValidation = (req,res,next) => {
    try{
        let {error} = signInSchema.validate(req.body)
        if(error){
            let errMess = error.details[0].message;
            logger.warn(errMess)
            return res.status(403).send({
                message : errMess
            })
        }
        next()
    }
    catch(error){
        return res.status(500).send({
            message : error.message
        })
    }
}


module.exports = {
    newUserValidation,
    loginValidation
}