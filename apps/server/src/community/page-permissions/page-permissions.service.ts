import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectKysely } from 'nestjs-kysely';
import { PagePermissionRepo } from '@docmost/db/repos/page/page-permission.repo';
import { PagePermissionMember } from '@docmost/db/repos/page/types/page-permission.types';
import { PageRepo } from '@docmost/db/repos/page/page.repo';
import { KyselyDB, KyselyTransaction } from '@docmost/db/types/kysely.types';
import { Page, PageAccess, User } from '@docmost/db/types/entity.types';
import { executeTx } from '@docmost/db/utils';
import SpaceAbilityFactory from '../../core/casl/abilities/space-ability.factory';
import {
  SpaceCaslAction,
  SpaceCaslSubject,
} from '../../core/casl/interfaces/space-ability.type';
import { PageAccessService } from '../../core/page/page-access/page-access.service';
import {
  PageAccessLevel,
  PagePermissionRole,
} from '../../common/helpers/types/permission';
import { PaginationOptions } from '@docmost/db/pagination/pagination-options';
import { CursorPaginationResult } from '@docmost/db/pagination/cursor-pagination';
import { PagePermissionMemberInput } from './dto/page-permissions.dto';

type ParsedMemberId = {
  type: 'user' | 'group';
  id: string;
};

@Injectable()
export class PagePermissionsService {
  constructor(
    @InjectKysely() private readonly db: KyselyDB,
    private readonly pageRepo: PageRepo,
    private readonly pagePermissionRepo: PagePermissionRepo,
    private readonly pageAccessService: PageAccessService,
    private readonly spaceAbility: SpaceAbilityFactory,
  ) {}

  async getInfo(
    pageId: string,
    user: User,
    pagination: PaginationOptions,
  ): Promise<{
    hasDirectRestriction: boolean;
    hasInheritedRestriction: boolean;
    hasAnyRestriction: boolean;
    canManage: boolean;
    members: CursorPaginationResult<PagePermissionMember>;
  }> {
    const page = await this.getVisiblePage(pageId, user);
    const access = await this.pagePermissionRepo.getUserPageAccessLevel(
      user.id,
      page.id,
    );
    const pageAccess = await this.pagePermissionRepo.findPageAccessByPageId(
      page.id,
    );

    return {
      ...access,
      canManage: await this.canManage(page, user),
      members: pageAccess
        ? await this.pagePermissionRepo.getPagePermissionsPaginated(
            pageAccess.id,
            pagination,
          )
        : this.emptyMembersResult(pagination),
    };
  }

  async listMembers(
    pageId: string,
    user: User,
    pagination: PaginationOptions,
  ): Promise<CursorPaginationResult<PagePermissionMember>> {
    const page = await this.getVisiblePage(pageId, user);
    const pageAccess = await this.pagePermissionRepo.findPageAccessByPageId(
      page.id,
    );
    if (!pageAccess) return this.emptyMembersResult(pagination);
    return this.pagePermissionRepo.getPagePermissionsPaginated(
      pageAccess.id,
      pagination,
    );
  }

  async enable(
    pageId: string,
    members: PagePermissionMemberInput[] | undefined,
    user: User,
  ) {
    const page = await this.getVisiblePage(pageId, user);
    await this.assertCanManage(page, user);

    await executeTx(this.db, async (trx) => {
      const pageAccess = await this.ensurePageAccess(page, user, trx);

      await this.upsertMember(
        pageAccess.id,
        { type: 'user', id: user.id },
        PagePermissionRole.WRITER,
        user.id,
        trx,
      );

      for (const member of members ?? []) {
        await this.upsertMember(
          pageAccess.id,
          this.parseMemberId(member.memberId),
          member.role,
          user.id,
          trx,
        );
      }
    });
  }

  async disable(pageId: string, user: User) {
    const page = await this.getVisiblePage(pageId, user);
    await this.assertCanManage(page, user);
    await this.pagePermissionRepo.deletePageAccess(page.id);
  }

  async addMembers(
    pageId: string,
    memberIds: string[],
    role: PagePermissionRole,
    user: User,
  ) {
    const page = await this.getVisiblePage(pageId, user);
    await this.assertCanManage(page, user);

    await executeTx(this.db, async (trx) => {
      const pageAccess = await this.ensurePageAccess(page, user, trx);
      for (const memberId of memberIds) {
        await this.upsertMember(
          pageAccess.id,
          this.parseMemberId(memberId),
          role,
          user.id,
          trx,
        );
      }
    });
  }

  async changeRole(
    pageId: string,
    memberId: string,
    role: PagePermissionRole,
    user: User,
  ) {
    const page = await this.getVisiblePage(pageId, user);
    await this.assertCanManage(page, user);
    const pageAccess = await this.getPageAccessOrThrow(page.id);
    const member = this.parseMemberId(memberId);
    const existing = await this.findExistingPermission(pageAccess.id, member);
    if (!existing) throw new NotFoundException('Page permission not found');

    if (
      existing.role === PagePermissionRole.WRITER &&
      role !== PagePermissionRole.WRITER
    ) {
      await this.assertNotLastWriter(pageAccess.id);
    }

    await this.pagePermissionRepo.updatePagePermissionRole(
      pageAccess.id,
      role,
      this.memberWhere(member),
    );
  }

  async removeMember(pageId: string, memberId: string, user: User) {
    const page = await this.getVisiblePage(pageId, user);
    await this.assertCanManage(page, user);
    const pageAccess = await this.getPageAccessOrThrow(page.id);
    const member = this.parseMemberId(memberId);
    const existing = await this.findExistingPermission(pageAccess.id, member);
    if (!existing) return;

    if (existing.role === PagePermissionRole.WRITER) {
      await this.assertNotLastWriter(pageAccess.id);
    }

    if (member.type === 'user') {
      await this.pagePermissionRepo.deletePagePermissionByUserId(
        pageAccess.id,
        member.id,
      );
    } else {
      await this.pagePermissionRepo.deletePagePermissionByGroupId(
        pageAccess.id,
        member.id,
      );
    }
  }

  private async getVisiblePage(pageId: string, user: User): Promise<Page> {
    const page = await this.pageRepo.findById(pageId);
    if (!page) throw new NotFoundException('Page not found');
    await this.pageAccessService.validateCanView(page, user);
    return page;
  }

  private async canManage(page: Page, user: User): Promise<boolean> {
    const ability = await this.spaceAbility.createForUser(user, page.spaceId);
    if (ability.can(SpaceCaslAction.Manage, SpaceCaslSubject.Settings)) {
      return true;
    }

    try {
      await this.pageAccessService.validateCanEdit(page, user);
      return true;
    } catch {
      return false;
    }
  }

  private async assertCanManage(page: Page, user: User) {
    if (!(await this.canManage(page, user))) {
      throw new ForbiddenException();
    }
  }

  private async ensurePageAccess(
    page: Page,
    user: User,
    trx: KyselyTransaction,
  ): Promise<PageAccess> {
    const existing = await this.pagePermissionRepo.findPageAccessByPageId(
      page.id,
      trx,
    );
    if (existing) return existing;

    return this.pagePermissionRepo.insertPageAccess(
      {
        pageId: page.id,
        workspaceId: page.workspaceId,
        spaceId: page.spaceId,
        accessLevel: PageAccessLevel.RESTRICTED,
        creatorId: user.id,
      },
      trx,
    );
  }

  private async getPageAccessOrThrow(pageId: string): Promise<PageAccess> {
    const pageAccess =
      await this.pagePermissionRepo.findPageAccessByPageId(pageId);
    if (!pageAccess) throw new NotFoundException('Page is not restricted');
    return pageAccess;
  }

  private parseMemberId(memberId: string): ParsedMemberId {
    const [type, id] = memberId.split('-', 2) as ['user' | 'group', string];
    return { type, id: memberId.slice(type.length + 1) };
  }

  private async upsertMember(
    pageAccessId: string,
    member: ParsedMemberId,
    role: PagePermissionRole,
    addedById: string,
    trx: KyselyTransaction,
  ) {
    const existing = await this.findExistingPermission(
      pageAccessId,
      member,
      trx,
    );
    if (existing) {
      if (
        existing.role === PagePermissionRole.WRITER &&
        role !== PagePermissionRole.WRITER
      ) {
        await this.assertNotLastWriter(pageAccessId, trx);
      }
      await this.pagePermissionRepo.updatePagePermissionRole(
        pageAccessId,
        role,
        this.memberWhere(member),
        trx,
      );
      return;
    }

    await this.pagePermissionRepo.insertPagePermissions(
      [
        {
          pageAccessId,
          role,
          addedById,
          userId: member.type === 'user' ? member.id : null,
          groupId: member.type === 'group' ? member.id : null,
        },
      ],
      trx,
    );
  }

  private async findExistingPermission(
    pageAccessId: string,
    member: ParsedMemberId,
    trx?: KyselyTransaction,
  ) {
    return member.type === 'user'
      ? this.pagePermissionRepo.findPagePermissionByUserId(
          pageAccessId,
          member.id,
          trx,
        )
      : this.pagePermissionRepo.findPagePermissionByGroupId(
          pageAccessId,
          member.id,
          trx,
        );
  }

  private memberWhere(member: ParsedMemberId) {
    return member.type === 'user'
      ? { userId: member.id }
      : { groupId: member.id };
  }

  private async assertNotLastWriter(
    pageAccessId: string,
    trx?: KyselyTransaction,
  ) {
    const writerCount = await this.pagePermissionRepo.countWritersByPageAccessId(
      pageAccessId,
      { trx },
    );
    if (writerCount <= 1) {
      throw new BadRequestException('At least one writer is required');
    }
  }

  private emptyMembersResult(
    pagination: PaginationOptions,
  ): CursorPaginationResult<PagePermissionMember> {
    return {
      items: [],
      meta: {
        limit: pagination.limit,
        hasNextPage: false,
        hasPrevPage: false,
        nextCursor: null,
        prevCursor: null,
      },
    };
  }
}
