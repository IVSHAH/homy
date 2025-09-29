import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { User } from './entities/user.entity';
import { UsersService } from './user.service';
import { UsersController } from './user.controller';
import { UserRepository } from './user.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    AuthModule,
  ],
  providers: [UsersService, UserRepository],
  controllers: [UsersController],
  exports: [UsersService, UserRepository],
})
export class UsersModule {}
