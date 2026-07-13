const Joi = require('joi')

const createProductSchema = Joi.object({
    name: Joi.string()
        .max(200)
        .required()
        .messages({
            'string.empty': 'Product name is required',
            'string.max': 'Product name cannot exceed 200 characters'
        }),

    shortDescription: Joi.string()
        .max(500)
        .required()
        .messages({
            'string.empty': 'Short description is required',
            'string.max': 'Short description cannot exceed 500 characters'
        }),

    description: Joi.string()
        .required()
        .messages({
            'string.empty': 'Description is required'
        }),

    price: Joi.number()
        .min(0)
        .required()
        .messages({
            'number_base': 'Price must be a number',
            'number_min': 'Price cannot be negative'
        }),

    discountPrice: Joi.number()
        .min(0)
        .less(Joi.ref('price'))
        .default(0)
        .messages({
            'number_less': 'Discount price must be less than the original price'
        }),

    stock: Joi.number()
        .min(0)
        .required()
        .messages({
            'number_base': 'Stock must be a number',
            'number_min': 'Must be grater than or equal to 0.'
        }),

    sku: Joi.string().optional(),

    category: Joi.string()
        .required()
        .messages({
            'string.empty': 'Category is required'
        }),

    subcategory: Joi.string().optional(),

    brand: Joi.string().optional(),

    // form-data sends this as a single string like "red,summer" — split it before/after validation.
    // This accepts either a raw comma-separated string or an already-split array.
    tags: Joi.alternatives().try(
        Joi.array().items(Joi.string()),
        Joi.string()
    ).optional(),

    featured: Joi.boolean().optional(),

    isActive: Joi.boolean().optional(),

    // createdBy is set by the controller from req.user, not sent by the client
    createdBy: Joi.forbidden()
})

const updateProductSchema = Joi.object({
    name: Joi.string().max(200).optional().messages({
        'string.max': 'Product name cannot exceed 200 characters'
    }),
    shortDescription: Joi.string().max(500).optional().messages({
        'string.max': 'Short description cannot exceed 500 characters'
    }),
    description: Joi.string().optional(),
    price: Joi.number().min(0).optional().messages({
        'number.min': 'Price cannot be negative'
    }),
    discountPrice: Joi.number().min(0).optional().messages({
        'number.min': 'Discount price cannot be negative'
    }),
    stock: Joi.number().integer().min(0).optional().messages({
        'number.integer': 'Stock must be a whole number',
        'number.min': 'Stock cannot be negative'
    }),
    sku: Joi.string().optional(),
    category: Joi.string().optional(),
    subcategory: Joi.string().optional(),
    brand: Joi.string().optional(),
    tags: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).optional(),
    featured: Joi.boolean().optional(),
    isActive: Joi.boolean().optional(),
    createdBy: Joi.forbidden(),
    images: Joi.any().optional(), // Handled by multer
    imagesToDelete: Joi.string().optional() // JSON array as string
})

const addReviewSchema = Joi.object({
    rating:Joi.number().integer().min(1).max(5).required().messages({
        'message':'Rating must be an integer number and between 1 & 5'
    }),
    comment:Joi.string().max(1000).required().messages({
        'message':'Comment is required.'
    })
})

module.exports = {
    createProductSchema,
    updateProductSchema,
    addReviewSchema
}
