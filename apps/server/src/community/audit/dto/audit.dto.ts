import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationOptions } from '@docmost/db/pagination/pagination-options';

export class AuditLogQueryDto extends PaginationOptions {
  @IsOptional()
  @IsString()
  event?: string;

  @IsOptional()
  @IsString()
  resourceType?: string;

  @IsOptional()
  @IsUUID()
  actorId?: string;

  @IsOptional()
  @IsUUID()
  spaceId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
