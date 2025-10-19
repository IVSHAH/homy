import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class CheckAvailabilityResponseDto {
  @ApiProperty({
    description: 'Whether login already exists',
    example: false,
  })
  @IsBoolean()
  loginExists: boolean;

  @ApiProperty({
    description: 'Whether email already exists',
    example: true,
  })
  @IsBoolean()
  emailExists: boolean;

  constructor(loginExists: boolean, emailExists: boolean) {
    this.loginExists = loginExists;
    this.emailExists = emailExists;
  }
}
