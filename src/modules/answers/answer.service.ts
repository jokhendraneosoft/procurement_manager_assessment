import { Types } from 'mongoose';
import { MongoServerError } from 'mongodb';
import { IAnswer } from './answer.model';
import { answerRepository } from './answer.repository';
import { orderRepository } from '../orders/order.repository';
import { checklistRepository } from '../checklists/checklist.repository';
import { ApiError } from '../../utils/ApiError';
import { UserRole } from '../../types/user.types';
import { AnswerStatus, IResponseItem } from '../../types/answer.types';
import { OrderStatus } from '../../types/order.types';
import { IQuestion } from '../../types/checklist.types';

export const getOrStartAnswerService = async (
    orderId: string,
    imId: string
): Promise<IAnswer> => {
    const order = await orderRepository.findById(orderId);
    if (!order) throw ApiError.notFound('Order');

    let answer = await answerRepository.findOneByOrder(orderId);
    if (answer) {
        const currentChecklistId = (order.checklist as any)?._id?.toString?.() ?? order.checklist?.toString?.();
        const snapshotChecklistId = answer.checklistSnapshot?.checklistId?.toString?.();
        if (
            answer.status === AnswerStatus.DRAFT &&
            currentChecklistId &&
            snapshotChecklistId &&
            currentChecklistId !== snapshotChecklistId
        ) {
            await answerRepository.deleteOne({ _id: answer._id });
            answer = null as any;
        } else if (answer) {
            return answer;
        }
    }

    if (order.inspectionManager?.toString() !== imId) {
        throw ApiError.forbidden('You are not assigned to inspect this order');
    }
    if (!order.checklist) {
        throw ApiError.badRequest('No checklist linked to this order yet');
    }

    const checklistRef = order.checklist as any;
    const checklist = await checklistRepository.findByIdLean(checklistRef._id);
    if (!checklist) throw ApiError.notFound('Linked checklist not found');

    const existing = await answerRepository.findOneByOrder(orderId);
    if (existing) return existing;

    try {
        answer = await answerRepository.create({
            order: new Types.ObjectId(orderId),
            inspectionManager: new Types.ObjectId(imId),
            checklistSnapshot: {
                checklistId: checklist._id as Types.ObjectId,
                title: checklist.title,
                version: checklist.version,
                sections: checklist.sections,
            },
            responses: [],
            status: AnswerStatus.DRAFT,
        });
    } catch (err) {
        if (err instanceof MongoServerError && err.code === 11000) {
            const existingAnswer = await answerRepository.findOneByOrder(orderId);
            if (existingAnswer) return existingAnswer;
        }
        throw err;
    }

    if (order.status === OrderStatus.PENDING) {
        order.status = OrderStatus.IN_PROGRESS;
        await orderRepository.save(order);
    }

    return answer;
};

export const updateAnswerService = async (
    answerId: string,
    responses: Partial<IResponseItem>[],
    imId: string
): Promise<IAnswer> => {
    const answer = await answerRepository.findById(answerId);
    if (!answer) throw ApiError.notFound('Answer sheet');

    if (answer.inspectionManager.toString() !== imId) {
        throw ApiError.forbidden('You can only update your own inspections');
    }
    if (answer.status === AnswerStatus.SUBMITTED) {
        throw ApiError.badRequest('Cannot update a submitted checklist');
    }

    const snapshot = answer.checklistSnapshot as any;
    const sections = snapshot.sections as any[];

    for (const newResp of responses) {
        if (!newResp.sectionId || !newResp.questionId) continue;

        const existingIdx = answer.responses.findIndex(
            (r) => r.sectionId === newResp.sectionId && r.questionId === newResp.questionId
        );

        const merged: IResponseItem = {
            sectionId: newResp.sectionId!,
            questionId: newResp.questionId!,
            questionText: '',
            answerType: '',
            value: newResp.value ?? null,
            imageUrl: newResp.imageUrl,
        };

        const section = sections.find((s: any) => s.sectionId === newResp.sectionId);
        if (section) {
            const foundQ = section.questions.find((q: any) => q.questionId === newResp.questionId) as IQuestion | undefined;
            if (foundQ) {
                merged.questionText = foundQ.questionText;
                merged.answerType = foundQ.answerType;
            } else {
                continue;
            }
        } else {
            continue;
        }

        if (existingIdx > -1) {
            answer.responses[existingIdx] = {
                ...answer.responses[existingIdx],
                ...merged,
                value: merged.value,
                imageUrl: merged.imageUrl,
            };
        } else {
            answer.responses.push(merged);
        }
    }

    answer.markModified('responses');
    await answerRepository.save(answer);
    return answer;
};

export const submitAnswerService = async (
    answerId: string,
    imId: string
): Promise<IAnswer> => {
    const answer = await answerRepository.findById(answerId);
    if (!answer) throw ApiError.notFound('Answer sheet');

    if (answer.inspectionManager.toString() !== imId) {
        throw ApiError.forbidden('Not your inspection');
    }

    const snapshot = answer.checklistSnapshot as any;
    const sections = snapshot.sections as any[];
    const errors: string[] = [];

    sections.forEach((section: any) => {
        section.questions.forEach((q: any) => {
            if (q.required) {
                const response = answer.responses.find(
                    (r) => r.sectionId === section.sectionId && r.questionId === q.questionId
                );
                const hasValue =
                    response &&
                    (response.value === true ||
                        response.value === false ||
                        (typeof response.value === 'string' && response.value.trim() !== '') ||
                        (Array.isArray(response.value) && response.value.length > 0) ||
                        typeof response.value === 'number' ||
                        (q.answerType === 'image' &&
                            response.imageUrl &&
                            String(response.imageUrl).trim() !== ''));

                if (!hasValue) {
                    errors.push(
                        `Missing required answer for: "${q.questionText}" in section "${section.title}"`
                    );
                }
            }
        });
    });

    if (errors.length > 0) {
        throw ApiError.badRequest('Validation failed', errors);
    }

    answer.status = AnswerStatus.SUBMITTED;
    answer.submittedAt = new Date();
    await answerRepository.save(answer);

    const order = await orderRepository.findById(answer.order.toString(), { populate: false });
    if (order) {
        order.status = OrderStatus.CHECKLIST_SUBMITTED;
        await orderRepository.save(order);
    }

    return answer;
};

export const getAnswerByOrderIdService = async (
    orderId: string,
    userId: string,
    role: string
): Promise<IAnswer> => {
    const answer = await answerRepository.findOneByOrder(orderId);
    if (!answer) throw ApiError.notFound('No answer sheet started for this order');

    const order = await orderRepository.findById(orderId, { populate: false });
    if (!order) throw ApiError.notFound('Order not found');

    if (role === UserRole.INSPECTION_MANAGER && order.inspectionManager?.toString() !== userId) {
        throw ApiError.forbidden();
    }
    if (role === UserRole.PROCUREMENT_MANAGER && order.procurementManager.toString() !== userId) {
        throw ApiError.forbidden();
    }
    if (role === UserRole.CLIENT && order.client.toString() !== userId) {
        throw ApiError.forbidden();
    }

    return answer;
};
