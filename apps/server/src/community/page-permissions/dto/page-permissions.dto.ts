import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PagePermissionRole } from '../../../common/helpers/types/permission';
import { PaginationOptions } from '@docmost/db/pagination/pagination-options';

export class PagePermissionPageDto extends PaginationOptions {
  @IsUUID()
  pageId: string;
}

export class PagePermissionMemberInput {
  @IsString()
  @Matches(/^(user|group)-[0-9a-fA-F-]{36}$/)
  memberId: string;

  @IsEnum(PagePermissionRole)
  role: PagePermissionRole;
}

export class PagePermissionEnableDto {
  @IsUUID()
  pageId: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => PagePermissionMemberInput)
  members?: PagePermissionMemberInput[];
}

export class PagePermissionMembersAddDto extends PagePermissionPageDto {
  @IsEnum(PagePermissionRole)
  role: PagePermissionRole;

  @IsArray()
  @ArrayMaxSize(50)
  @Matches(/^(user|group)-[0-9a-fA-F-]{36}$/, { each: true })
  memberIds: string[];
}

export class PagePermissionMemberDto extends PagePermissionPageDto {
  @Matches(/^(user|group)-[0-9a-fA-F-]{36}$/)
  memberId: string;
}

export class PagePermissionChangeRoleDto extends PagePermissionMemberDto {
  @IsEnum(PagePermissionRole)
  role: PagePermissionRole;
}
