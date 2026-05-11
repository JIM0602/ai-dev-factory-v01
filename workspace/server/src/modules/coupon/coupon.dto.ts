import { IsOptional, IsString, IsInt, Min, Max, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueryCouponsDto {
  @ApiPropertyOptional({ description: '券来源筛选', enum: ['all', 'meituan', 'douyin', 'other'] })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ description: '开始日期，格式 YYYY-MM-DD' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '日期格式错误' })
  start_date?: string;

  @ApiPropertyOptional({ description: '结束日期，格式 YYYY-MM-DD' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '日期格式错误' })
  end_date?: string;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页条数', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  page_size?: number = 20;
}
