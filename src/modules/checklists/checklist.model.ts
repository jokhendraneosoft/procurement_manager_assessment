import { Schema, model, Document, Types } from 'mongoose';
import { AnswerType, ISection } from '../../types/checklist.types';

export interface IChecklist extends Document {
    title: string;
    description?: string;
    createdBy: Types.ObjectId;
    client?: Types.ObjectId;
    version: number;
    parentChecklist?: Types.ObjectId;
    sections: ISection[];
    isActive: boolean;
}

const questionSchema = new Schema(
    {
        questionId: { type: String, required: true },
        questionText: { type: String, required: true, trim: true },
        answerType: {
            type: String,
            enum: {
                values: Object.values(AnswerType),
                message: `answerType must be one of: ${Object.values(AnswerType).join(', ')}`,
            },
            required: true,
        },
        options: [{ type: String, trim: true }],
        required: { type: Boolean, default: false },
    },
    { _id: false },
);

const sectionSchema = new Schema(
    {
        sectionId: { type: String, required: true },
        title: { type: String, required: true, trim: true },
        questions: {
            type: [questionSchema],
            validate: {
                validator: (v: unknown[]) => v.length > 0,
                message: 'Each section must have at least one question',
            },
        },
    },
    { _id: false },
);

const checklistSchema = new Schema<IChecklist>(
    {
        title: { type: String, required: [true, 'Title is required'], trim: true },
        description: { type: String, trim: true },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Creator is required'],
        },
        client: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        version: { type: Number, default: 1 },
        parentChecklist: {
            type: Schema.Types.ObjectId,
            ref: 'Checklist',
            default: null,
        },
        sections: {
            type: [sectionSchema],
            validate: {
                validator: (v: unknown[]) => v.length > 0,
                message: 'Checklist must have at least one section',
            },
        },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true, versionKey: false },
);

export const Checklist = model<IChecklist>('Checklist', checklistSchema);
