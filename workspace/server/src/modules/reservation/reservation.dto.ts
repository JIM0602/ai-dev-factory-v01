import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateReservationDto {
  @ApiProperty({ description: '预约日期，格式 YYYY-MM-DD' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '日期格式错误' })
  reservation_date: string;

  @ApiProperty({ description: '时段开始时间，格式 HH:mm' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: '时间格式错误' })
  slot_start_time: string;

  @ApiProperty({ description: '时段结束时间，格式 HH:mm' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: '时间格式错误' })
  slot_end_time: string;

  @ApiPropertyOptional({ description: '人数，默认 1，范围 1-10' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  guest_count?: number = 1;

  @ApiProperty({ description: '手机号，11 位' })
  @IsString()
  @IsNotEmpty({ message: '请输入正确的手机号' })
  @Matches(/^1[3-9]\d{9}$/, { message: '请输入正确的手机号' })
  customer_phone: string;

  @ApiProperty({ description: '顾客姓名' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  customer_name: string;

  @ApiPropertyOptional({ description: '备注，最长 100 字' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  remark?: string;
}

export class MerchantCreateReservationDto extends CreateReservationDto {}

export class UpdateReservationStatusDto {
  @ApiPropertyOptional({ description: '拒绝原因，最长 100 字' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reason?: string;
}

export class QueryReservationSlotsDto {
  @ApiProperty({ description: '日期，格式 YYYY-MM-DD' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '日期格式错误' })
  date: string;
}

export class QueryMyReservationsDto {
  @ApiPropertyOptional({ description: '状态筛选', enum: ['all', 'pending', 'confirmed', 'completed', 'cancelled'] })
  @IsOptional()
  @IsString()
  status?: string;

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

export class QueryMerchantReservationsDto {
  @ApiPropertyOptional({ description: '日期筛选，格式 YYYY-MM-DD' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ description: '状态筛选' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: '按手机号或姓名搜索' })
  @IsOptional()
  @IsString()
  search?: string;

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
