export enum AnswerType {
    BOOLEAN = 'boolean',
    DROPDOWN = 'dropdown',
    MULTI_CHOICE = 'multi_choice',
    IMAGE = 'image',
    TEXT = 'text',
}

export interface IQuestion {
    questionId: string;
    questionText: string;
    answerType: AnswerType;
    options?: string[];
    required: boolean;
}

export interface ISection {
    sectionId: string;
    title: string;
    questions: IQuestion[];
}
