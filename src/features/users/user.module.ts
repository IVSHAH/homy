import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './user.service';
import { UsersController } from './user.controller';
import { UserRepository } from './user.repository';
import { AuthModule } from '../../auth/auth.module';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import { RefreshTokenRepository } from '../../auth/refresh-token.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User, RefreshToken]), forwardRef(() => AuthModule)],
  providers: [UsersService, UserRepository, RefreshTokenRepository],
  controllers: [UsersController],
  exports: [UsersService, UserRepository],
})
export class UsersModule {}
