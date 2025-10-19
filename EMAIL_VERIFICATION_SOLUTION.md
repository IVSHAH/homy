# Email Verification with Unisender - Implementation Guide

## 1. Установка зависимостей

```bash
npm install axios form-data
npm install -D @types/node
```

## 2. Переменные окружения (.env)

Добавьте в `.env`:

```env
# Unisender Configuration
UNISENDER_API_KEY=your-unisender-api-key
UNISENDER_DOMAIN=your-domain.com
FROM_EMAIL=noreply@your-domain.com
FRONTEND_URL=http://localhost:3000
```

## 3. Создание структуры файлов

### 3.1. Enum для ролей

**`src/common/enums/role.enum.ts`**
```typescript
export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}
```

### 3.2. Обновление User Entity

**`src/features/users/entities/user.entity.ts`**
```typescript
import { Role } from '../../../common/enums/role.enum';

@Entity()
export class User {
  // ... существующие поля

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: Role;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  verificationToken?: string;

  @Column({ type: 'timestamptz', nullable: true })
  verificationTokenExpires?: Date;

  // ... остальные поля
}
```

### 3.3. Базовые интерфейсы

**`src/common/interfaces/http-service.interface.ts`**
```typescript
import { AxiosInstance } from 'axios';

export interface IHttpService {
  instance(config: any): AxiosInstance;
}
```

**`src/common/interfaces/email-transport.interface.ts`**
```typescript
export abstract class EmailTransportService {
  abstract sendMail(to: string, subject: string, html: string): Promise<void>;
}
```

### 3.4. Mail модуль

**`src/mail/mail-config.service.ts`**
```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailConfigService {
  constructor(private configService: ConfigService) {}

  get mailApiKey(): string {
    return this.configService.getOrThrow<string>('UNISENDER_API_KEY');
  }

  get mailDomain(): string {
    return this.configService.getOrThrow<string>('UNISENDER_DOMAIN');
  }

  get fromEmail(): string {
    return this.configService.getOrThrow<string>('FROM_EMAIL');
  }

  get frontendUrl(): string {
    return this.configService.getOrThrow<string>('FRONTEND_URL');
  }
}
```

**`src/mail/http.service.ts`**
```typescript
import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { IHttpService } from '../common/interfaces/http-service.interface';

@Injectable()
export class HttpService implements IHttpService {
  instance(config: any): AxiosInstance {
    return axios.create(config);
  }
}
```

**`src/mail/unisender.service.ts`**
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { AxiosInstance } from 'axios';
import * as FormData from 'form-data';
import { EmailTransportService } from '../common/interfaces/email-transport.interface';
import { HttpService } from './http.service';
import { MailConfigService } from './mail-config.service';

@Injectable()
export class UnisenderService extends EmailTransportService {
  private api: AxiosInstance;
  private readonly logger = new Logger(UnisenderService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly mailConfigService: MailConfigService,
  ) {
    super();
    this.api = this.httpService.instance({
      baseURL: `https://api.unisender.com/ru/api`,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async sendMail(to: string, subject: string, html: string): Promise<void> {
    const formData = new FormData();
    formData.append('format', 'json');
    formData.append('api_key', this.mailConfigService.mailApiKey);
    formData.append('email', to);
    formData.append('sender_name', 'No Reply');
    formData.append('sender_email', this.mailConfigService.fromEmail);
    formData.append('subject', subject);
    formData.append('body', html);
    formData.append('list_id', '1'); // Создайте список в Unisender и укажите ID

    try {
      await this.api.post('/sendEmail', formData, {
        headers: formData.getHeaders(),
      });
      this.logger.log(`Email sent successfully to ${to}`);
    } catch (e) {
      this.logger.error('Failed to send email via Unisender');
      this.logger.error(e);
      throw e;
    }
  }
}
```

**`src/mail/templates/verify-email.template.ts`**
```typescript
export const verifyEmailTemplate = (verificationUrl: string): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verify Your Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2>Welcome to Homy!</h2>
    <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}"
         style="background-color: #4CAF50;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                display: inline-block;">
        Verify Email
      </a>
    </div>
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all;">${verificationUrl}</p>
    <p style="color: #666; font-size: 12px; margin-top: 30px;">
      This link will expire in 24 hours. If you didn't create an account, please ignore this email.
    </p>
  </div>
</body>
</html>
`;
```

**`src/mail/mail.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UnisenderService } from './unisender.service';
import { HttpService } from './http.service';
import { MailConfigService } from './mail-config.service';

@Module({
  imports: [ConfigModule],
  providers: [UnisenderService, HttpService, MailConfigService],
  exports: [UnisenderService],
})
export class MailModule {}
```

## 4. Auth модуль - DTO

**`src/auth/dto/verify-email.dto.ts`**
```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Email verification token',
    example: 'abc123xyz',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
```

**`src/auth/dto/resend-verification.dto.ts`**
```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ResendVerificationDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;
}
```

## 5. Обновление AuthService

**`src/auth/auth.service.ts`** - добавить методы:

```typescript
import { UnisenderService } from '../mail/unisender.service';
import { MailConfigService } from '../mail/mail-config.service';
import { verifyEmailTemplate } from '../mail/templates/verify-email.template';
import { Role } from '../common/enums/role.enum';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    // ... существующие зависимости
    private readonly unisenderService: UnisenderService,
    private readonly mailConfigService: MailConfigService,
  ) {}

  // Обновить метод login - проверка isVerified
  async login(signInDto: SignInDto, context: RequestContext): Promise<LoginResponseDto> {
    const user = await this.usersService.validateCredentials(signInDto.login, signInDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Проверка верификации
    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    return this.generateTokens(user, context);
  }

  // Генерация токена верификации
  private generateVerificationToken(): { token: string; expires: Date } {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // Токен действителен 24 часа
    return { token, expires };
  }

  // Отправка письма верификации
  async sendVerificationEmail(user: User): Promise<void> {
    const { token, expires } = this.generateVerificationToken();

    await this.usersService.updateVerificationToken(user.id, token, expires);

    const verificationUrl = `${this.mailConfigService.frontendUrl}/verify-email?token=${token}`;
    const emailHtml = verifyEmailTemplate(verificationUrl);

    await this.unisenderService.sendMail(
      user.email,
      'Verify your email',
      emailHtml,
    );
  }

  // Верификация email по токену
  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.usersService.findByVerificationToken(token);

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (user.verificationTokenExpires < new Date()) {
      throw new BadRequestException('Verification token has expired');
    }

    await this.usersService.markAsVerified(user.id);

    return { message: 'Email verified successfully' };
  }

  // Повторная отправка письма
  async resendVerification(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('Email is already verified');
    }

    await this.sendVerificationEmail(user);

    return { message: 'Verification email sent' };
  }
}
```

## 6. Обновление UsersService

**`src/features/users/user.service.ts`** - добавить методы:

```typescript
async updateVerificationToken(
  userId: number,
  token: string,
  expires: Date,
): Promise<void> {
  await this.userRepository.update(userId, {
    verificationToken: token,
    verificationTokenExpires: expires,
  });
}

async findByVerificationToken(token: string): Promise<User | null> {
  return this.userRepository.findByVerificationToken(token);
}

async markAsVerified(userId: number): Promise<void> {
  await this.userRepository.update(userId, {
    isVerified: true,
    verificationToken: null,
    verificationTokenExpires: null,
  });
}

async findByEmail(email: string): Promise<User | null> {
  return this.userRepository.findByEmail(email);
}

// Обновить метод register - автоматическая отправка письма
async register(
  createUserDto: CreateUserDto,
  context?: RequestContext,
): Promise<LoginResponseDto> {
  try {
    await this.checkUserUnique(createUserDto.login, createUserDto.email);

    const hashedPassword = await bcrypt.hash(createUserDto.password, BCRYPT_ROUNDS);
    const user = await this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role: Role.USER, // По умолчанию USER
      isVerified: false, // По умолчанию не верифицирован
    });

    // Отправка письма верификации
    await this.authService.sendVerificationEmail(user);

    return this.authService.generateTokensForUser(user, context);
  } catch (error) {
    if (error instanceof ConflictException) {
      throw error;
    }
    throw new InternalServerErrorException('Failed to create user');
  }
}
```

## 7. Обновление UserRepository

**`src/features/users/user.repository.ts`** - добавить метод:

```typescript
async findByVerificationToken(token: string): Promise<User | null> {
  return this.userRepository.findOne({
    where: { verificationToken: token, deletedAt: IsNull() },
  });
}
```

## 8. Обновление AuthController

**`src/auth/auth.controller.ts`** - добавить эндпоинты:

```typescript
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { Public } from '../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  // ... существующие методы

  @Post('verify-email')
  @Public()
  @ApiOperation({ summary: 'Verify email address' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<{ message: string }> {
    return this.authService.verifyEmail(dto.token);
  }

  @Post('resend-verification')
  @Public()
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resendVerification(
    @Body() dto: ResendVerificationDto,
  ): Promise<{ message: string }> {
    return this.authService.resendVerification(dto.email);
  }
}
```

## 9. Роли и Guards

### 9.1. Декоратор @Roles()

**`src/common/decorators/roles.decorator.ts`**
```typescript
import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

### 9.2. RolesGuard

**`src/auth/guards/roles.guard.ts`**
```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../common/enums/role.enum';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // Нет требований к ролям
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role === role);
  }
}
```

### 9.3. VerifiedGuard (опционально)

**`src/auth/guards/verified.guard.ts`**
```typescript
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class VerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();

    if (!user.isVerified) {
      throw new UnauthorizedException('Email verification required');
    }

    return true;
  }
}
```

### 9.4. Регистрация Guards глобально

**`src/app.module.ts`**
```typescript
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './auth/guards/roles.guard';

@Module({
  // ... imports, controllers, providers
  providers: [
    // ... existing providers
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
```

## 10. Обновление JWT

### 10.1. Обновить auth.types.ts

**`src/auth/auth.types.ts`**
```typescript
import { Role } from '../common/enums/role.enum';

export interface JwtPayload {
  userId: number;
  login: string;
  email: string;
  role: Role;
  isVerified: boolean;
}

export interface ValidateUserPayload {
  userId: number;
  login: string;
  email: string;
  role: Role;
  isVerified: boolean;
}
```

### 10.2. Обновить payload.utils.ts

**`src/common/utils/payload.utils.ts`**
```typescript
import { User } from '../../features/users/entities/user.entity';
import { JwtPayload } from '../../auth/auth.types';

export function createAccessTokenPayload(user: User): JwtPayload {
  return {
    userId: user.id,
    login: user.login,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
  };
}
```

### 10.3. Обновить JWT Strategy

**`src/auth/strategies/jwt.strategy.ts`**
```typescript
async validate(payload: JwtPayload): Promise<ValidateUserPayload | null> {
  const result = await this.authService.validateUser(payload);

  if (!result) {
    return null;
  }

  return {
    userId: result.userId,
    login: result.login,
    email: result.email,
    role: result.role,
    isVerified: result.isVerified,
  };
}
```

**`src/auth/auth.service.ts`** - обновить validateUser:
```typescript
async validateUser(payload: JwtPayload): Promise<ValidateUserPayload | null> {
  try {
    const user = await this.usersService.validateUserById(payload.userId);

    if (!user) {
      return null;
    }

    return {
      userId: user.id,
      login: user.login,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    };
  } catch (error) {
    if (error instanceof NotFoundException) {
      return null;
    }
    throw error;
  }
}
```

## 11. Обновление AuthModule

**`src/auth/auth.module.ts`**
```typescript
import { MailModule } from '../mail/mail.module';
import { RefreshTokenRepository } from './refresh-token.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';

@Module({
  imports: [
    PassportModule,
    ConfigModule,
    MailModule, // Добавить
    TypeOrmModule.forFeature([RefreshToken]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '14d' },
      }),
    }),
    forwardRef(() => UsersModule),
  ],
  providers: [AuthService, JwtStrategy, RefreshTokenRepository],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
```

## 12. Использование в контроллерах

### Пример защиты эндпоинта ролями:

```typescript
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Get('admin-only')
@Roles(Role.ADMIN)
@ApiBearerAuth()
async adminEndpoint() {
  return { message: 'Admin access granted' };
}

@Get('verified-users')
@UseGuards(VerifiedGuard) // Опционально
@ApiBearerAuth()
async verifiedUsersEndpoint() {
  return { message: 'Verified users only' };
}
```

## 13. Миграция БД

После добавления новых полей в User entity выполните:

```bash
# Если используете TypeORM CLI для миграций
npm run migration:generate -- src/migrations/AddEmailVerification

# Или просто запустите приложение с synchronize: true (только для dev!)
```

## 14. Тестирование

### Обновите моки в тестах:

```typescript
const createUser = (overrides: Partial<User> = {}): User => ({
  id: 1,
  login: 'john',
  email: 'john@example.com',
  password: 'hashed-password',
  age: 30,
  description: 'about me',
  role: Role.USER,
  isVerified: true, // или false для тестирования верификации
  verificationToken: null,
  verificationTokenExpires: null,
  refreshTokens: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null as unknown as Date,
  ...overrides,
});
```

## 15. Frontend интеграция

### Endpoint для верификации:
```
GET /verify-email?token=abc123xyz
```

Frontend должен:
1. Получить token из URL query параметра
2. Отправить POST запрос на `/auth/verify-email` с `{ token }`
3. Показать сообщение об успехе/ошибке

### Повторная отправка:
```
POST /auth/resend-verification
Body: { "email": "user@example.com" }
```

## 16. Настройка Unisender

1. Зарегистрируйтесь на [unisender.com](https://www.unisender.com/)
2. Получите API ключ в личном кабинете
3. Создайте список рассылки
4. Укажите ID списка в `unisender.service.ts` (строка с `list_id`)
5. Настройте домен для отправки писем

---

## Итоговая структура проекта:

```
src/
├── common/
│   ├── enums/
│   │   └── role.enum.ts
│   ├── interfaces/
│   │   ├── email-transport.interface.ts
│   │   ├── http-service.interface.ts
│   │   └── request-context.interface.ts
│   ├── decorators/
│   │   ├── roles.decorator.ts
│   │   ├── public.decorator.ts
│   │   ├── user.decorator.ts
│   │   └── context.decorator.ts
│   └── utils/
│       ├── token.utils.ts
│       └── payload.utils.ts
├── mail/
│   ├── mail.module.ts
│   ├── mail-config.service.ts
│   ├── http.service.ts
│   ├── unisender.service.ts
│   └── templates/
│       └── verify-email.template.ts
├── auth/
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   ├── roles.guard.ts
│   │   └── verified.guard.ts
│   ├── dto/
│   │   ├── sign-in.dto.ts
│   │   ├── refresh-token.dto.ts
│   │   ├── verify-email.dto.ts
│   │   ├── resend-verification.dto.ts
│   │   └── ...
│   ├── entities/
│   │   └── refresh-token.entity.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   ├── auth.types.ts
│   └── refresh-token.repository.ts
└── features/
    └── users/
        ├── entities/
        │   └── user.entity.ts (обновлено)
        ├── user.service.ts (обновлено)
        ├── user.repository.ts (обновлено)
        └── ...
```

## Проверка работоспособности

1. Запустите приложение
2. Зарегистрируйте нового пользователя через `/auth/register`
3. Проверьте почту - должно прийти письмо с ссылкой верификации
4. Перейдите по ссылке (или отправьте POST с токеном)
5. Попробуйте залогиниться - должен быть доступ
6. Проверьте защищённые эндпоинты с ролями

Готово! 🎉
