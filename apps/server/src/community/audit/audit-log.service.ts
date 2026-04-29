import { ForbiddenException, Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { KyselyDB } from '@docmost/db/types/kysely.types';
import {
  CursorPaginationResult,
  executeWithCursorPagination,
} from '@docmost/db/pagination/cursor-pagination';
import { User, Workspace } from '@docmost/db/types/entity.types';
import WorkspaceAbilityFactory from '../../core/casl/abilities/workspace-ability.factory';
import {
  WorkspaceCaslAction,
  WorkspaceCaslSubject,
} from '../../core/casl/interfaces/workspace-ability.type';
import { getPageTitle } from '../../common/helpers';
import { AuditLogQueryDto } from './dto/audit.dto';
import { AUDIT_RETENTION_DAYS } from './community-audit.service';

export type CommunityAuditLog = {
  id: string;
  workspaceId: string;
  actorId?: string;
  actorType: string;
  event: string;
  resourceType: string;
  resourceId?: string;
  spaceId?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  createdAt: Date;
  actor?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  resource?: {
    id: string;
    name: string;
    slug?: string;
    slugId?: string;
  };
};

@Injectable()
export class AuditLogService {
  constructor(
    @InjectKysely() private readonly db: KyselyDB,
    private readonly workspaceAbility: WorkspaceAbilityFactory,
  ) {}

  async findAuditLogs(
    user: User,
    workspace: Workspace,
    dto: AuditLogQueryDto,
  ): Promise<CursorPaginationResult<CommunityAuditLog>> {
    this.assertCanViewAudit(user, workspace);

    let baseQuery = this.db
      .selectFrom('audit')
      .leftJoin('users as actors', 'actors.id', 'audit.actorId')
      .leftJoin('pages as resourcePages', (join) =>
        join
          .onRef('resourcePages.id', '=', 'audit.resourceId')
          .on('audit.resourceType', '=', 'page'),
      )
      .leftJoin('spaces as resourceSpaces', (join) =>
        join
          .onRef('resourceSpaces.id', '=', 'audit.resourceId')
          .on('audit.resourceType', 'in', ['space', 'space_member']),
      )
      .leftJoin('groups as resourceGroups', (join) =>
        join
          .onRef('resourceGroups.id', '=', 'audit.resourceId')
          .on('audit.resourceType', '=', 'group'),
      )
      .leftJoin('users as resourceUsers', (join) =>
        join
          .onRef('resourceUsers.id', '=', 'audit.resourceId')
          .on('audit.resourceType', '=', 'user'),
      )
      .select([
        'audit.id',
        'audit.workspaceId',
        'audit.actorId',
        'audit.actorType',
        'audit.event',
        'audit.resourceType',
        'audit.resourceId',
        'audit.spaceId',
        'audit.changes',
        'audit.metadata',
        'audit.ipAddress',
        'audit.createdAt',
        'actors.id as actorUserId',
        'actors.name as actorName',
        'actors.email as actorEmail',
        'actors.avatarUrl as actorAvatarUrl',
        'resourcePages.id as pageId',
        'resourcePages.title as pageTitle',
        'resourcePages.slugId as pageSlugId',
        'resourceSpaces.id as spaceResourceId',
        'resourceSpaces.name as spaceName',
        'resourceSpaces.slug as spaceSlug',
        'resourceGroups.id as groupResourceId',
        'resourceGroups.name as groupName',
        'resourceUsers.id as userResourceId',
        'resourceUsers.name as userResourceName',
        'resourceUsers.email as userResourceEmail',
      ])
      .where('audit.workspaceId', '=', workspace.id);

    if (dto.event) {
      baseQuery = baseQuery.where('audit.event', '=', dto.event);
    }
    if (dto.resourceType) {
      baseQuery = baseQuery.where('audit.resourceType', '=', dto.resourceType);
    }
    if (dto.actorId) {
      baseQuery = baseQuery.where('audit.actorId', '=', dto.actorId);
    }
    if (dto.spaceId) {
      baseQuery = baseQuery.where('audit.spaceId', '=', dto.spaceId);
    }
    if (dto.startDate) {
      baseQuery = baseQuery.where(
        'audit.createdAt',
        '>=',
        new Date(dto.startDate),
      );
    }
    if (dto.endDate) {
      baseQuery = baseQuery.where('audit.createdAt', '<=', new Date(dto.endDate));
    }

    const query = this.db.selectFrom(baseQuery.as('sub')).selectAll('sub');
    const result = await executeWithCursorPagination(query, {
      perPage: dto.limit,
      cursor: dto.cursor,
      beforeCursor: dto.beforeCursor,
      fields: [
        { expression: 'sub.createdAt', direction: 'desc', key: 'createdAt' },
        { expression: 'sub.id', direction: 'desc', key: 'id' },
      ],
      parseCursor: (cursor) => ({
        createdAt: new Date(cursor.createdAt),
        id: cursor.id,
      }),
    });

    return {
      meta: result.meta,
      items: result.items.map((row) => this.mapAuditRow(row)),
    };
  }

  getRetention(user: User, workspace: Workspace): { retentionDays: number } {
    this.assertCanViewAudit(user, workspace);
    return { retentionDays: AUDIT_RETENTION_DAYS };
  }

  private assertCanViewAudit(user: User, workspace: Workspace) {
    const ability = this.workspaceAbility.createForUser(user, workspace);
    if (ability.cannot(WorkspaceCaslAction.Manage, WorkspaceCaslSubject.Audit)) {
      throw new ForbiddenException();
    }
  }

  private mapAuditRow(row: any): CommunityAuditLog {
    const metadata = row.metadata as Record<string, any> | null;
    const log: CommunityAuditLog = {
      id: row.id,
      workspaceId: row.workspaceId,
      actorId: row.actorId ?? undefined,
      actorType: row.actorType,
      event: row.event,
      resourceType: row.resourceType,
      resourceId: row.resourceId ?? undefined,
      spaceId: row.spaceId ?? undefined,
      changes: row.changes ?? undefined,
      metadata: metadata ?? undefined,
      ipAddress: row.ipAddress ?? undefined,
      createdAt: row.createdAt,
    };

    if (row.actorUserId) {
      log.actor = {
        id: row.actorUserId,
        name: row.actorName,
        email: row.actorEmail,
        avatarUrl: row.actorAvatarUrl ?? undefined,
      };
    }

    log.resource = this.mapResource(row, metadata);
    return log;
  }

  private mapResource(row: any, metadata?: Record<string, any> | null) {
    if (row.pageId) {
      return {
        id: row.pageId,
        name: getPageTitle(row.pageTitle),
        slugId: row.pageSlugId,
      };
    }
    if (row.spaceResourceId) {
      return {
        id: row.spaceResourceId,
        name: row.spaceName ?? row.spaceResourceId,
        slug: row.spaceSlug,
      };
    }
    if (row.groupResourceId) {
      return { id: row.groupResourceId, name: row.groupName };
    }
    if (row.userResourceId) {
      return {
        id: row.userResourceId,
        name: row.userResourceName ?? row.userResourceEmail,
      };
    }
    if (row.resourceId) {
      const name =
        metadata?.title ??
        metadata?.name ??
        metadata?.resourceName ??
        row.resourceId;
      return { id: row.resourceId, name: String(name) };
    }
    return undefined;
  }
}
