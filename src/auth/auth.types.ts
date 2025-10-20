import { Role } from '../common/enums/role.enum';

export interface JwtPayload {
  userId: number;
  login: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface ValidateUserPayload {
  userId: number;
  login: string;
  email: string;
  role: Role;
}

export interface AccessTokenPayload {
  userId: number;
  login: string;
  email: string;
  role: Role;
}
