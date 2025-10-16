import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';

export class GetUsersFilterDto {
  @ApiProperty({ description: 'Filter by login', example: 'john', required: false })
  @IsOptional()
  @IsString()
  loginFilter?: string;

  @ApiProperty({ description: 'Page number', example: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', example: 10, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
