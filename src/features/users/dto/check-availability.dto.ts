import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, Length } from 'class-validator';

export class CheckAvailabilityDto {
  @ApiProperty({
    description: 'User login to check availability',
    example: 'john_doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(3, 50)
  login?: string;

  @ApiProperty({
    description: 'User email to check availability',
    example: 'john@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}
