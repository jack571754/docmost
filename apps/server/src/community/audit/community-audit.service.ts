import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ClsService } from 'nestjs-cls';
import { InjectKysely } from 'nestjs-kysely';
import { sql } from 'kysely';
import {
  AuditLogContext,
  IAuditService,
} from '../../integrations/audit/audit.service';
import {
  ActorType,
  AuditLogData,
  AuditLogPayload,
} from '../../common/events/audit-events';
import {
  AuditContext,
  AUDIT_CONTEXT_KEY,
} from '../../common/middlewares/audit-context.middleware';
import { KyselyDB } from '@docmost/db/types/kysely.types';

const AUDIT_RETENTION_DAYS = 90;

@Injectable()
export class CommunityAuditService implements IAuditService {
  private readonly logger = new Logger(CommunityAuditService.name);

  constructor(
    @InjectKysely() private readonly db: KyselyDB,
    private readonly cls: ClsService,
  ) {}

  async log(payload: AuditLogPayload): Promise<void> {
    const context = this.cls.get<AuditContext>(AUDIT_CONTEXT_KEY);
    if (!context?.workspaceId) return;

    await this.write({
      ...payload,
      workspaceId: context.workspaceId,
      actorId: context.actorId ?? undefined,
      actorType: context.actorType ?? 'user',
      ipAddress: context.ipAddress ?? undefined,
      userAgent: context.userAgent ?? undefined,
    });
  }

  async logWithContext(
    payload: AuditLogPayload,
    context: AuditLogContext,
  ): Promise<void> {
    await this.write({
      ...payload,
      workspaceId: context.workspaceId,
      actorId: context.actorId,
      actorType: context.actorType ?? 'user',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }

  async logBatchWithContext(
    payloads: AuditLogPayload[],
    context: AuditLogContext,
  ): Promise<void> {
    for (const payload of payloads) {
      await this.logWithContext(payload, context);
    }
  }

  setActorId(actorId: string): void {
    const context = this.cls.get<AuditContext>(AUDIT_CONTEXT_KEY);
    if (!context) return;
    this.cls.set(AUDIT_CONTEXT_KEY, { ...context, actorId });
  }

  setActorType(actorType: ActorType): void {
    const context = this.cls.get<AuditContext>(AUDIT_CONTEXT_KEY);
    if (!context) return;
    this.cls.set(AUDIT_CONTEXT_KEY, { ...context, actorType });
  }

  updateRetention(_workspaceId: string, _retentionDays: number): void {
    // Community audit retention is fixed at 90 days.
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOldLogs(): Promise<void> {
    try {
      await sql`
        DELETE FROM audit
        WHERE created_at < now() - interval '90 days'
      `.execute(this.db);
    } catch (err) {
      this.logger.warn(
        `Failed to cleanup audit logs: ${this.getErrorMessage(err)}`,
      );
    }
  }

  private async write(data: AuditLogData): Promise<void> {
    try {
      const metadata = {
        ...(data.metadata ?? {}),
        ...(data.userAgent ? { userAgent: data.userAgent } : {}),
      };

      await this.db
        .insertInto('audit')
        .values({
          workspaceId: data.workspaceId,
          actorId: data.actorId ?? null,
          actorType: data.actorType,
          event: data.event,
          resourceType: data.resourceType,
          resourceId: data.resourceId ?? null,
          spaceId: data.spaceId ?? null,
          changes: data.changes ?? null,
          metadata: Object.keys(metadata).length > 0 ? metadata : null,
          ipAddress: data.ipAddress ?? null,
        })
        .execute();
    } catch (err) {
      this.logger.warn(`Failed to write audit log: ${this.getErrorMessage(err)}`);
    }
  }

  private getErrorMessage(err: unknown): string {
    return err instanceof Error ? err.message : String(err);
  }
}

export { AUDIT_RETENTION_DAYS };
