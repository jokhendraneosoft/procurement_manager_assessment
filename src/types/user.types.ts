export enum UserRole {
    ADMIN = 'admin',
    PROCUREMENT_MANAGER = 'procurement_manager',
    INSPECTION_MANAGER = 'inspection_manager',
    CLIENT = 'client',
}

export interface IUserPayload {
    _id: string;
    role: UserRole;
    name: string;
}
