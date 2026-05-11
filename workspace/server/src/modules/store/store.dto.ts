import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  MaxLength,
  Matches,
  IsInt,
  Min,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateStoreDto {
  @ApiProperty({ description: '门店名称，最长 30 字' })
  @IsString()
  @IsNotEmpty({ message: '门店名称不能为空' })
  @MaxLength(30)
  name: string;

  @ApiProperty({ description: '完整地址，最长 200 字' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  address: string;

  @ApiPropertyOptional({ description: '门牌指引，最长 100 字' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  address_guide?: string;

  @ApiProperty({ description: '联系电话，11 位手机号' })
  @IsString()
  @IsNotEmpty({ message: '请输入正确的手机号' })
  @Matches(/^1[3-9]\d{9}$/, { message: '请输入正确的手机号' })
  phone: string;

  @ApiProperty({ description: '照片 URL 数组，最少 1 张最多 9 张' })
  @IsArray()
  @ArrayMinSize(1, { message: '至少保留一张门店照片' })
  @ArrayMaxSize(9, { message: '门店照片不能超过 9 张' })
  photos: string[];

  @ApiProperty({ description: '营业开始时间，格式 HH:mm' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: '时间格式错误，请使用 HH:mm 格式' })
  open_time: string;

  @ApiProperty({ description: '营业结束时间，格式 HH:mm' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: '时间格式错误，请使用 HH:mm 格式' })
  close_time: string;

  @ApiPropertyOptional({ description: '固定休息日数组，0=周日,1=周一,...,6=周六' })
  @IsOptional()
  @IsArray()
  rest_days?: number[];

  @ApiProperty({ description: '桌位总数' })
  @IsInt()
  @Min(1)
  table_count: number;

  @ApiPropertyOptional({ description: '门店介绍，最长 200 字' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}

export class UpdateRulesDto {
  @ApiProperty({ description: '预约是否需要确认' })
  @IsNotEmpty()
  require_confirmation: boolean;

  @ApiProperty({ description: '提前预约天数' })
  @IsInt()
  @Min(1)
  advance_days: number;

  @ApiProperty({ description: '截止分钟数' })
  @IsInt()
  @Min(0)
  cutoff_minutes: number;

  @ApiPropertyOptional({ description: '自动取消小时数，null 表示不启用' })
  @IsOptional()
  auto_cancel_hours?: number | null;

  @ApiProperty({ description: '顾客可取消的小时数' })
  @IsInt()
  @Min(0)
  customer_cancel_hours: number;

  @ApiProperty({ description: '时段时长（分钟）：30/60/90/120' })
  @IsInt()
  @IsIn([30, 60, 90, 120])
  slot_duration: number;
}
