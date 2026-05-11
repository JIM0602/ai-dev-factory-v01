import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsArray,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CouponItemDto {
  @ApiProperty({ description: '券码' })
  @IsString()
  @IsNotEmpty()
  coupon_code: string;

  @ApiProperty({ description: '券来源：meituan/douyin/other' })
  @IsString()
  @IsNotEmpty()
  coupon_source: string;

  @ApiPropertyOptional({ description: '券类型描述' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  coupon_type?: string;
}

export class CheckInDto {
  @ApiPropertyOptional({ description: '桌位号，若不传则自动分配最小可用号' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  table_number?: number;

  @ApiPropertyOptional({ description: '团购券列表' })
  @IsOptional()
  @IsArray()
  coupons?: CouponItemDto[];
}

export class ExtendTimeDto {
  @ApiProperty({ description: '加时时长（分钟），必须 > 0' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  extension_minutes: number;
}

export class ChangeTableDto {
  @ApiProperty({ description: '新桌位号' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  table_number: number;
}
