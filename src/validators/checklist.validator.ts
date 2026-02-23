import Joi from 'joi';
import { AnswerType } from '../types/checklist.types';

const questionSchema = Joi.object({
    questionId: Joi.string().required(),
    questionText: Joi.string().required().trim(),
    answerType: Joi.string()
        .valid(...Object.values(AnswerType))
        .required(),
    options: Joi.array().items(Joi.string().trim()).optional(),
    required: Joi.boolean().default(false),
});

const sectionSchema = Joi.object({
    sectionId: Joi.string().required(),
    title: Joi.string().required().trim(),
    questions: Joi.array().items(questionSchema).min(1).required(),
});

export const createChecklistSchema = Joi.object({
    title: Joi.string().required().trim().min(3).max(100),
    description: Joi.string().trim().allow('', null),
    client: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).allow(null),
    sections: Joi.array().items(sectionSchema).min(1).required(),
});

export const updateChecklistSchema = createChecklistSchema;
