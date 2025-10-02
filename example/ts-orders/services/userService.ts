import { logger } from "../utils/logger";

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export class UserService {
  private users: User[] = [];
  private nextId = 1;

  async createUser(name: string, email: string): Promise<User> {
    const user: User = {
      id: `user_${this.nextId++}`,
      name,
      email,
      createdAt: new Date(),
    };

    this.users.push(user);
    logger.info(`User created: ${user.id}`);

    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.find((user) => user.id === id) || null;
  }

  async getAllUsers(): Promise<User[]> {
    return [...this.users];
  }

  // Unused function for validator to catch
  async deleteUser(id: string): Promise<boolean> {
    const index = this.users.findIndex((user) => user.id === id);
    if (index !== -1) {
      this.users.splice(index, 1);
      return true;
    }
    return false;
  }

  // Another unused function
  async updateUserEmail(id: string, newEmail: string): Promise<boolean> {
    const user = this.users.find((user) => user.id === id);
    if (user) {
      user.email = newEmail;
      return true;
    }
    return false;
  }
}
