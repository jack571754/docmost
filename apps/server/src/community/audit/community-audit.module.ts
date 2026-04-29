import { Global, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AUDIT_SERVICE } from '../../integrations/audit/audit.service';
import { CaslModule } from '../../core/casl/casl.module';
import { AuditController } from './audit.controller';
import { AuditLogService } from './audit-log.service';
import { CommunityAuditService } from './community-audit.service';

@Global()
@Module({
  imports: [ScheduleModule.forRoot(), CaslModule],
  controllers: [AuditController],
  providers: [
    AuditLogService,
    CommunityAuditService,
    {
      provide: AUDIT_SERVICE,
      useExisting: CommunityAuditService,
    },
  ],
  exports: [AUDIT_SERVICE, AuditLogService],
})
export class CommunityAuditModule {}
