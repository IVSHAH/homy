export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserExistsResponse {
  loginExists: boolean;
  emailExists: boolean;
}

export type UserWhereCondition = {
  id?: number;
  login?: string;
  email?: string;
  deletedAt?: Date | null;
};

// TODO: а стоит так делать?
export { JwtPayload } from
     '../auth/auth.types';
export interface AuthResponse {
  accessToken: string;
  user: {
    id: number;
    login: string;
    email: string;
    age: number;
    description?: string;
  };
}
