const Joi = require('joi')

const newUserSchema = Joi.object({
    userName: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email({
        minDomainSegments: 2,
        tlds: { allow: ['com', 'net'] },
    }).required(),

    password: Joi.string().pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,30}$/
    )
        .required()
        .min(8)
        .messages({
            'string.pattern.base':
                'Password must be 8 characters, and contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
        }),
})

/* ---------------------------------------- */

const verifyOtpSchema =Joi.object({
    email:Joi.string().email().required(),
    otp: Joi.string().required()
})

/* ---------------------------------------- */

const logInSchema = Joi.object({
    email: Joi.string().email({
        minDomainSegments: 2,
        tlds: { allow: ['com', 'net'] },
    }).required(),
    password: Joi.string().pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,30}$/
    ).required()
})

/* ---------------------------------------- */

const forgotPasswordSchema = Joi.object({
    email:Joi.string().email().required(),
})

/* ---------------------------------------- */

const resetPasswordSchema = Joi.object({
    token:Joi.string().required(),
    newPassword: Joi.string().pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,30}$/
    )
})

module.exports = {
    newUserSchema,
    verifyOtpSchema,
    logInSchema,
    forgotPasswordSchema,
    resetPasswordSchema
}