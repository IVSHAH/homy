# 🔐 Решение: Множественные сессии (Multiple Refresh Tokens)

## 📋 Проблема

**Текущая реализация:**
- User хранит `refreshTokenHash` и `refreshTokenExpiresAt` как **одно** поле
- При каждом login/refresh старый токен **перезаписывается**
- Результат: пользователь может иметь только **одну активную сессию**

**Сценарий проблемы:**
```
1. User логинится с телефона → refreshToken1
2. User логинится с ноутбука → refreshToken1 удален, создан refreshToken2
3. User пытается refresh на телефоне → refreshToken1 невалиден → logout!
```

---

## ✅ Решение 1: Отдельная таблица RefreshToken (рекомендуется)

### **Архитектура:**

```
User (1) ←──→ (N) RefreshToken
```

Каждый пользователь может иметь **несколько** активных refresh токенов.

### **Шаг 1: Создать entity RefreshToken**

```typescript
// src/auth/entities/refresh-token.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../features/users/entities/user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  tokenHash: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  deviceInfo?: string; // "Chrome on MacOS", "Mobile App iOS"

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress?: string; // IP адрес для аудита

  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent?: string; // User-Agent для аудита

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'boolean', default: false })
  revoked: boolean; // Можно отозвать вручную

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ name: 'userId' })
  userId: number;
}
```

**Почему так:**
- `deviceInfo` - позволяет пользователю видеть "где я залогинен"
- `ipAddress` - для security аудита
- `userAgent` - дополнительная информация о сессии
- `revoked` - можно вручную отозвать токен (logout from device)
- `ManyToOne` - связь с User

---

### **Шаг 2: Обновить User Entity**

```typescript
// src/features/users/entities/user.entity.ts
import { RefreshToken } from '../../auth/entities/refresh-token.entity';

@Entity()
export class User {
  // ... существующие поля

  // УДАЛИТЬ ЭТИ ПОЛЯ:
  // @Column({ type: 'text', nullable: true })
  // refreshTokenHash: string | null = null;
  //
  // @Column({ type: 'timestamptz', nullable: true })
  // refreshTokenExpiresAt: Date | null = null;

  // ДОБАВИТЬ СВЯЗЬ:
  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[];
}
```

---

### **Шаг 3: Создать RefreshTokenRepository**

```typescript
// src/auth/refresh-token.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { RefreshToken } from './entities/refresh-token.entity';

@Injectable()
export class RefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly repository: Repository<RefreshToken>
  ) {}

  async create(data: {
    userId: number;
    tokenHash: string;
    expiresAt: Date;
    deviceInfo?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<RefreshToken> {
    const token = this.repository.create(data);
    return this.repository.save(token);
  }

  async findByUserIdAndHash(userId: number, tokenHash: string): Promise<RefreshToken | null> {
    return this.repository.findOne({
      where: { userId, tokenHash, revoked: false },
    });
  }

  async revokeToken(id: number): Promise<void> {
    await this.repository.update(id, { revoked: true });
  }

  async revokeAllUserTokens(userId: number): Promise<void> {
    await this.repository.update({ userId }, { revoked: true });
  }

  async deleteExpired(): Promise<void> {
    await this.repository.delete({
      expiresAt: LessThan(new Date()),
    });
  }

  async findAllByUserId(userId: number): Promise<RefreshToken[]> {
    return this.repository.find({
      where: { userId, revoked: false },
      order: { createdAt: 'DESC' },
    });
  }

  async countActiveTokens(userId: number): Promise<number> {
    return this.repository.count({
      where: { userId, revoked: false },
    });
  }
}
```

---

### **Шаг 4: Обновить AuthService**

```typescript
// src/auth/auth.service.ts
import { RefreshTokenRepository } from './refresh-token.repository';

@Injectable()
export class AuthService {
  private readonly refreshTokenTtlMs = 30 * 24 * 60 * 60 * 1000;
  private readonly maxActiveTokensPerUser = 5; // ограничение

  constructor(
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private jwtService: JwtService,
    private refreshTokenRepository: RefreshTokenRepository, // ← НОВОЕ
  ) {}

  async login(signInDto: SignInDto, context: { ipAddress?: string; userAgent?: string }): Promise<LoginResponseDto> {
    const user = await this.usersService.validateCredentials(signInDto.login, signInDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user, context);
  }

  async refresh(
    refreshToken: string,
    context: { ipAddress?: string; userAgent?: string }
  ): Promise<LoginResponseDto> {
    const { userId, tokenPart } = this.parseRefreshToken(refreshToken);

    let user: User;
    try {
      user = await this.usersService.validateUserById(userId);
    } catch (_error) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // НОВАЯ ЛОГИКА: проверяем токен в таблице RefreshToken
    const tokenHash = await bcrypt.hash(tokenPart, 10);
    const storedToken = await this.refreshTokenRepository.findByUserIdAndHash(userId, tokenHash);

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.expiresAt.getTime() < Date.now()) {
      await this.refreshTokenRepository.revokeToken(storedToken.id);
      throw new UnauthorizedException('Refresh token expired');
    }

    // Отзываем старый токен (rotation)
    await this.refreshTokenRepository.revokeToken(storedToken.id);

    return this.generateTokens(user, context);
  }

  private async generateTokens(
    user: User,
    context: { ipAddress?: string; userAgent?: string }
  ): Promise<LoginResponseDto> {
    const payload = this.createAccessPayload(user);
    const accessToken = this.jwtService.sign(payload);

    const { token, rawToken, expiresAt } = this.generateRefreshToken(user);

    // Ограничение количества активных токенов
    const activeCount = await this.refreshTokenRepository.countActiveTokens(user.id);
    if (activeCount >= this.maxActiveTokensPerUser) {
      // Удалить самый старый токен
      const tokens = await this.refreshTokenRepository.findAllByUserId(user.id);
      const oldestToken = tokens[tokens.length - 1];
      await this.refreshTokenRepository.revokeToken(oldestToken.id);
    }

    await this.persistRefreshToken(user.id, rawToken, expiresAt, context);

    return new LoginResponseDto(accessToken, token, new UserResponseDto(user));
  }

  private async persistRefreshToken(
    userId: number,
    rawToken: string,
    expiresAt: Date,
    context: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    const hash = await bcrypt.hash(rawToken, 10);

    await this.refreshTokenRepository.create({
      userId,
      tokenHash: hash,
      expiresAt,
      deviceInfo: this.extractDeviceInfo(context.userAgent),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }

  private extractDeviceInfo(userAgent?: string): string | undefined {
    if (!userAgent) return undefined;

    // Простая экстракция (можно использовать библиотеку ua-parser-js)
    if (userAgent.includes('Mobile')) return 'Mobile Device';
    if (userAgent.includes('iPhone')) return 'iPhone';
    if (userAgent.includes('Android')) return 'Android Device';
    if (userAgent.includes('Chrome')) return 'Chrome Browser';
    if (userAgent.includes('Firefox')) return 'Firefox Browser';
    return 'Unknown Device';
  }
}
```

---

### **Шаг 5: Обновить контроллер для передачи context**

```typescript
// src/auth/auth.controller.ts
import { Req } from '@nestjs/common';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  @Post('login')
  async login(@Body() signInDto: SignInDto, @Req() req: Request): Promise<LoginResponseDto> {
    const context = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };
    return this.authService.login(signInDto, context);
  }

  @Post('refresh')
  async refresh(@Body() refreshTokenDto: RefreshTokenDto, @Req() req: Request): Promise<LoginResponseDto> {
    const context = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };
    return this.authService.refresh(refreshTokenDto.refreshToken, context);
  }
}
```

---

### **Шаг 6: Добавить endpoint для управления сессиями**

```typescript
// src/auth/auth.controller.ts
@Get('sessions')
@ApiBearerAuth()
async getSessions(@User('userId') userId: number): Promise<SessionResponseDto[]> {
  return this.authService.getUserSessions(userId);
}

@Delete('sessions/:sessionId')
@ApiBearerAuth()
async revokeSession(
  @User('userId') userId: number,
  @Param('sessionId') sessionId: number
): Promise<void> {
  return this.authService.revokeSession(userId, sessionId);
}

@Delete('sessions')
@ApiBearerAuth()
async revokeAllSessions(@User('userId') userId: number): Promise<void> {
  return this.authService.revokeAllSessions(userId);
}

// src/auth/auth.service.ts
async getUserSessions(userId: number): Promise<SessionResponseDto[]> {
  const tokens = await this.refreshTokenRepository.findAllByUserId(userId);
  return tokens.map(token => new SessionResponseDto(token));
}

async revokeSession(userId: number, sessionId: number): Promise<void> {
  const token = await this.refreshTokenRepository.findByUserIdAndHash(userId, sessionId);
  if (!token || token.userId !== userId) {
    throw new ForbiddenException('Cannot revoke this session');
  }
  await this.refreshTokenRepository.revokeToken(sessionId);
}

async revokeAllSessions(userId: number): Promise<void> {
  await this.refreshTokenRepository.revokeAllUserTokens(userId);
}
```

---

## 🎯 Преимущества решения:

| Преимущество | Описание |
|--------------|----------|
| **Множественные сессии** | Пользователь может логиниться с нескольких устройств |
| **Аудит** | Видно где и когда был логин (IP, device, user-agent) |
| **Безопасность** | Можно отозвать токен с конкретного устройства |
| **Rotation** | Старый refresh token автоматически отзывается при refresh |
| **Ограничение** | Макс 5 активных сессий (защита от утечки) |
| **Управление** | User видит список активных сессий и может их отзывать |

---

## 🔒 Security Best Practices:

1. **Refresh Token Rotation** - каждый refresh создает новый токен и отзывает старый
2. **Max Sessions Limit** - не более N активных токенов (защита от брутфорса)
3. **Auto Cleanup** - периодическая чистка истекших токенов (cron job)
4. **IP Tracking** - аномальная активность (логин с другого континента)
5. **Revocation** - возможность отозвать все токены при компрометации

---

## 📊 Миграция данных:

```typescript
// migration/xxx-add-refresh-token-table.ts
export class AddRefreshTokenTable1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Создать таблицу refresh_tokens
    await queryRunner.query(`
      CREATE TABLE refresh_tokens (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        "tokenHash" TEXT NOT NULL,
        "expiresAt" TIMESTAMPTZ NOT NULL,
        "deviceInfo" VARCHAR(100),
        "ipAddress" VARCHAR(45),
        "userAgent" VARCHAR(255),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "revoked" BOOLEAN NOT NULL DEFAULT false,
        CONSTRAINT "FK_refresh_tokens_user" FOREIGN KEY ("userId")
          REFERENCES "user"(id) ON DELETE CASCADE
      );
    `);

    // 2. Мигрировать существующие refresh tokens
    await queryRunner.query(`
      INSERT INTO refresh_tokens ("userId", "tokenHash", "expiresAt", "createdAt")
      SELECT
        id,
        "refreshTokenHash",
        "refreshTokenExpiresAt",
        NOW()
      FROM "user"
      WHERE "refreshTokenHash" IS NOT NULL
    `);

    // 3. Удалить старые колонки из user
    await queryRunner.dropColumn('user', 'refreshTokenHash');
    await queryRunner.dropColumn('user', 'refreshTokenExpiresAt');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback
    await queryRunner.addColumn('user', new TableColumn({
      name: 'refreshTokenHash',
      type: 'text',
      isNullable: true,
    }));

    await queryRunner.addColumn('user', new TableColumn({
      name: 'refreshTokenExpiresAt',
      type: 'timestamptz',
      isNullable: true,
    }));

    await queryRunner.dropTable('refresh_tokens');
  }
}
```

---

## ✅ Чеклист внедрения:

- [ ] Создать entity `RefreshToken`
- [ ] Создать `RefreshTokenRepository`
- [ ] Обновить `User` entity (удалить поля, добавить relation)
- [ ] Обновить `AuthService` (использовать repository)
- [ ] Обновить `AuthController` (передавать context)
- [ ] Создать миграцию БД
- [ ] Добавить endpoints управления сессиями
- [ ] Добавить cron job для чистки истекших токенов
- [ ] Обновить тесты
- [ ] Обновить документацию API

---

## 🚀 Дополнительные фичи (опционально):

1. **Email уведомления** - "Новый вход с устройства X"
2. **Suspicious Activity Detection** - вход с нового IP/страны
3. **Session Naming** - пользователь может назвать сессию ("Рабочий ноутбук")
4. **Last Activity** - обновлять поле при каждом refresh
5. **2FA Required** - требовать 2FA для новых устройств
