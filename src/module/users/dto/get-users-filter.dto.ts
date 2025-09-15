import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';

export class GetUsersFilterDto {
  @ApiProperty({ description: 'Фильтр по логину', example: 'john', required: false })
  @IsOptional()
  @IsString()
  loginFilter?: string;

  @ApiProperty({ description: 'Номер страницы', example: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: 'Лимит на странице', example: 10, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
