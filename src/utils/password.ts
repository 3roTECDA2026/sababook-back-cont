// src/utils/password.ts
import bcrypt from 'bcrypt';

// SAB-136: un solo lugar para hashear contraseñas (alta y edición de usuarios)
export const PASSWORD_SALT_ROUNDS = 10;
export const MIN_PASSWORD_LENGTH = 6;

export const hashPassword = (password: string): Promise<string> =>
  bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
