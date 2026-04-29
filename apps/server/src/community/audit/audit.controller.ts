import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthUser } from '../../common/decorators/auth-user.decorator';
import { AuthWorkspace } from '../../common/decorators/auth-workspace.decorator';
import { User, Workspace } from '@docmost/db/types/entity.types';
import { AuditLogService } from './audit-log.service';
import { AuditLogQueryDto } from './dto/audit.dto';

@UseGuards(JwtAuthGuard)
@Controller('community/audit')
export class AuditController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @HttpCode(HttpStatus.OK)
  @Post()
  async findAuditLogs(
    @Body() dto: AuditLogQueryDto,
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace,
  ) {
    return this.auditLogService.findAuditLogs(user, workspace, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('retention')
  async getRetention(
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace,
  ) {
    return this.auditLogService.getRetention(user, workspace);
  }
}
