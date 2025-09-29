export interface JwtPayload {
    userId: number;
    login: string;
    email: string;
    iat?: number;
    exp?: number;
}

export interface ValidateUserPayload {
    userId: number;
    login: string;
    email: string;
}

export interface AuthRequest {
    user: ValidateUserPayload;
}

export interface AccessTokenPayload {
    userId: number;
    login: string;
    email: string;
}