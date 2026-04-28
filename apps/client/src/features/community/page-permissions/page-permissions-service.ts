import api from "@/lib/api-client";
import { IPagination, QueryParams } from "@/lib/types.ts";
import {
  AddPagePermissionMembersInput,
  ChangePagePermissionRoleInput,
  PagePermissionMember,
  PagePermissionsInfo,
  RemovePagePermissionMemberInput,
} from "@/features/community/page-permissions/types.ts";

export async function getPagePermissionsInfo(
  pageId: string,
): Promise<PagePermissionsInfo> {
  const req = await api.post<PagePermissionsInfo>(
    "/community/page-permissions/info",
    { pageId, limit: 50 },
  );
  return req.data;
}

export async function getPagePermissionMembers(
  pageId: string,
  params?: QueryParams,
): Promise<IPagination<PagePermissionMember>> {
  const req = await api.post<IPagination<PagePermissionMember>>(
    "/community/page-permissions/members",
    { pageId, ...params },
  );
  return req.data;
}

export async function enablePagePermissions(pageId: string): Promise<void> {
  await api.post("/community/page-permissions/enable", { pageId });
}

export async function disablePagePermissions(pageId: string): Promise<void> {
  await api.post("/community/page-permissions/disable", { pageId });
}

export async function addPagePermissionMembers(
  data: AddPagePermissionMembersInput,
): Promise<void> {
  await api.post("/community/page-permissions/members/add", data);
}

export async function changePagePermissionRole(
  data: ChangePagePermissionRoleInput,
): Promise<void> {
  await api.post("/community/page-permissions/members/change-role", data);
}

export async function removePagePermissionMember(
  data: RemovePagePermissionMemberInput,
): Promise<void> {
  await api.post("/community/page-permissions/members/remove", data);
}
