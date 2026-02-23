import { Schema, model, Document, Types } from 'mongoose';
import { ISection } from '../../types/checklist.types';
import { AnswerStatus, IResponseItem } from '../../types/answer.types';

interface IChecklistSnapshot {
    checklistId: Types.ObjectId;
    title: string;
    version: number;
    sections: ISection[];
}

export interface IAnswer extends Document {
    order: Types.ObjectId;
    inspectionManager: Types.ObjectId;
    checklistSnapshot: IChecklistSnapshot;
    responses: IResponseItem[];
    status: AnswerStatus;
    submittedAt?: Date;
}

const responseSchema = new Schema<IResponseItem>(
    {
        sectionId: { type: String, required: true },
        questionId: { type: String, required: true },
        questionText: { type: String, required: true },
        answerType: { type: String, required: true },
        value: { type: Schema.Types.Mixed, default: null },
        imageUrl: { type: String, default: null },
    },
    { _id: false },
);

const answerSchema = new Schema<IAnswer>(
    {
        order: {
            type: Schema.Types.ObjectId,
            ref: 'Order',
            required: [true, 'Order is required'],
            unique: true,
        },
        inspectionManager: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Inspection manager is required'],
        },
        checklistSnapshot: {
            checklistId: { type: Schema.Types.ObjectId, required: true },
            title: { type: String, required: true },
            version: { type: Number, required: true },
            sections: { type: Schema.Types.Mixed, required: true },
        },
        responses: [responseSchema],
        status: {
            type: String,
            enum: Object.values(AnswerStatus),
            default: AnswerStatus.DRAFT,
        },
        submittedAt: { type: Date, default: null },
    },
    { timestamps: true, versionKey: false },
);

export const Answer = model<IAnswer>('Answer', answerSchema);
