import { Types } from 'mongoose';
import { Answer, IAnswer } from './answer.model';
import { AnswerStatus } from '../../types/answer.types';

/**
 * Answer repository – all data access for Answer entity.
 */
export const answerRepository = {
    findOneByOrder(orderId: string) {
        return Answer.findOne({ order: new Types.ObjectId(orderId) });
    },

    findById(id: string) {
        return Answer.findById(id);
    },

    create(data: Partial<IAnswer>) {
        return Answer.create(data);
    },

    deleteOne(filter: { _id?: Types.ObjectId; order?: Types.ObjectId; status?: AnswerStatus }) {
        return Answer.deleteOne(filter);
    },

    deleteDraftByOrderId(orderId: string) {
        return Answer.deleteOne({
            order: new Types.ObjectId(orderId),
            status: AnswerStatus.DRAFT,
        });
    },

    save(doc: IAnswer) {
        return doc.save();
    },
};
