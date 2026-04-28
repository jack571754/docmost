import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthUser } from '../../common/decorators/auth-user.decorator';
import { User } from '@docmost/db/types/entity.types';
import { PagePermissionsService } from './page-permissions.service';
import {
  PagePermissionChangeRoleDto,
  PagePermissionEnableDto,
  PagePermissionMemberDto,
  PagePermissionMembersAddDto,
  PagePermissionPageDto,
} from './dto/page-permissions.dto';

@UseGuards(JwtAuthGuard)
@Controller('community/page-permissions')
export class PagePermissionsController {
  constructor(private readonly service: PagePermissionsService) {}

  @HttpCode(HttpStatus.OK)
  @Post('info')
  async info(@Body() dto: PagePermissionPageDto, @AuthUser() user: User) {
    return this.service.getInfo(dto.pageId, user, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('members')
  async members(@Body() dto: PagePermissionPageDto, @AuthUser() user: User) {
    return this.service.listMembers(dto.pageId, user, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('enable')
  async enable(@Body() dto: PagePermissionEnableDto, @AuthUser() user: User) {
    await this.service.enable(dto.pageId, dto.members, user);
  }

  @HttpCode(HttpStatus.OK)
  @Post('disable')
  async disable(@Body() dto: PagePermissionPageDto, @AuthUser() user: User) {
    await this.service.disable(dto.pageId, user);
  }

  @HttpCode(HttpStatus.OK)
  @Post('members/add')
  async addMembers(
    @Body() dto: PagePermissionMembersAddDto,
    @AuthUser() user: User,
  ) {
    await this.service.addMembers(dto.pageId, dto.memberIds, dto.role, user);
  }

  @HttpCode(HttpStatus.OK)
  @Post('members/change-role')
  async changeRole(
    @Body() dto: PagePermissionChangeRoleDto,
    @AuthUser() user: User,
  ) {
    await this.service.changeRole(dto.pageId, dto.memberId, dto.role, user);
  }

  @HttpCode(HttpStatus.OK)
  @Post('members/remove')
  async removeMember(
    @Body() dto: PagePermissionMemberDto,
    @AuthUser() user: User,
  ) {
    await this.service.removeMember(dto.pageId, dto.memberId, user);
  }
}
