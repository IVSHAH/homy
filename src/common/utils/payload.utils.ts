import { User } from '../../features/users/entities/user.entity';
import { AccessTokenPayload } from '../../auth/auth.types';
import { Role } from '../enums/role.enum';

export function createAccessTokenPayload(user: User): AccessTokenPayload {
  return {
    userId: user.id,
    login: user.login,
    email: user.email,
    role: user.role,
  };
}

export function createMinimalAccessTokenPayload(
  userId: number,
  login: string,
  email: string,
  role: Role
): AccessTokenPayload {
  return { userId, login, email, role };
}
