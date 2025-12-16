export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly role: UserRole,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(props: {
    id: string;
    email: string;
    passwordHash: string;
    role?: UserRole;
    createdAt?: Date;
    updatedAt?: Date;
  }): User {
    return new User(
      props.id,
      props.email,
      props.passwordHash,
      props.role || UserRole.USER,
      props.createdAt || new Date(),
      props.updatedAt || new Date(),
    );
  }
}

export enum UserRole {
  ADMIN = 'admin',
  BARBER = 'barber',
  USER = 'user',
}
