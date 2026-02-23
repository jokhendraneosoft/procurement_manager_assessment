export enum AnswerStatus {
    DRAFT = 'draft',
    SUBMITTED = 'submitted',
}

export interface IResponseItem {
    sectionId: string;
    questionId: string;
    questionText: string;
    answerType: string;
    value: boolean | string | string[] | null;
    imageUrl?: string | null;
}
