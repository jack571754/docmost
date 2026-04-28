import { IPagination } from "@/lib/types.ts";

export enum PagePermissionRole {
  Reader = "reader",
  Writer = "writer",
}

export type PagePermissionMemberType = "user" | "group";

export type PagePermissionMember = {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string | null;
  memberCount?: number;
  isDefault?: boolean;
  type: PagePermissionMemberType;
  role: PagePermissionRole;
  createdAt: Date;
};

export type PagePermissionsInfo = {
  hasDirectRestriction: boolean;
  hasInheritedRestriction: boolean;
  hasAnyRestriction: boolean;
  canAccess: boolean;
  canEdit: boolean;
  canManage: boolean;
  members: IPagination<PagePermissionMember>;
};

export type AddPagePermissionMembersInput = {
  pageId: string;
  memberIds: string[];
  role: PagePermissionRole;
};

export type ChangePagePermissionRoleInput = {
  pageId: string;
  memberId: string;
  role: PagePermissionRole;
};

export type RemovePagePermissionMemberInput = {
  pageId: string;
  memberId: string;
};
