export interface AuthService {
  validateCredentials(email: string, password: string);
  createUser(email: string, password: string);
  findUserById(id: string);
}