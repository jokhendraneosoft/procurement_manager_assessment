import Joi from 'joi';

export const startAnswerSchema = Joi.object({
    orderId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
});

export const submitAnswerSchema = Joi.object({
    // Validation happens logic-side mostly due to dynamic nature, 
    // but we can validate the structure of the incoming patch
    responses: Joi.array().items(
        Joi.object({
            sectionId: Joi.string().required(),
            questionId: Joi.string().required(),
            value: Joi.alternatives().try(
                Joi.string(),
                Joi.boolean(),
                Joi.array().items(Joi.string()),
                Joi.number() // Just in case
            ).allow(null),
            imageUrl: Joi.string().uri().allow(null, '')
        })
    ).required()
});
