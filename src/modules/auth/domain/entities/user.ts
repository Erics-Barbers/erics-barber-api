export class User {
    constructor(
        public readonly id: string,
        public readonly email: string,
        public readonly passwordHash: string,
        public readonly role: UserRole,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) {}
}

export enum UserRole {
    ADMIN = 'admin',
    BARBER = 'barber',
    USER = 'user',
}