import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { UserResponseDto } from '../../features/users/dto/user-response.dto';

export class LoginResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  @IsString()
  accessToken: string;

  @ApiProperty({ description: 'Refresh token' })
  @IsString()
  refreshToken: string;

  @ApiProperty({ type: UserResponseDto })
  @ValidateNested()
  @Type(() => UserResponseDto)
  user: UserResponseDto;

  constructor(accessToken: string, refreshToken: string, user: UserResponseDto) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.user = user;
  }
}
