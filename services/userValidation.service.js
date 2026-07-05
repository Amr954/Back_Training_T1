const Joi = require('joi')

const newUserSchema = Joi.object({
    userName: Joi.string().alphanum().min(3).max(30).required(),

    email: Joi.string().email({
        minDomainSegments: 2,
        tlds: { allow: ['com', 'net'] },
    }),

    password: Joi.string().pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,30}$/
    )
        .required()
        .messages({
            'string.pattern.base':
                'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
        }),
})

const signInSchema = Joi.object({
    email: Joi.string().email({
        minDomainSegments: 2,
        tlds: { allow: ['com', 'net'] },
    }),
    password: Joi.string().pattern(
        // new RegExp('^[a-zA-Z0-9]{3,30}$'))
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,30}$/
    )
        .required()
        .messages({
            'string.pattern.base':
                'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
        }),
})

module.exports = {
    newUserSchema,
    signInSchema
}