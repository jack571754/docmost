import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import {
  addPagePermissionMembers,
  changePagePermissionRole,
  disablePagePermissions,
  enablePagePermissions,
  getPagePermissionMembers,
  getPagePermissionsInfo,
  removePagePermissionMember,
} from "@/features/community/page-permissions/page-permissions-service.ts";
import {
  AddPagePermissionMembersInput,
  ChangePagePermissionRoleInput,
  RemovePagePermissionMemberInput,
} from "@/features/community/page-permissions/types.ts";

function useInvalidatePagePermissions() {
  const queryClient = useQueryClient();

  return async (pageId: string) => {
    await queryClient.invalidateQueries({
      predicate: (query) =>
        ["page-permissions", "page-permission-members", "pages"].includes(
          query.queryKey[0] as string,
        ) ||
        query.queryKey[0] === "sidebar-pages" ||
        query.queryKey[0] === "root-sidebar-pages",
    });
  };
}

export function usePagePermissionsInfoQuery(pageId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["page-permissions", pageId],
    queryFn: () => getPagePermissionsInfo(pageId),
    enabled: enabled && !!pageId,
  });
}

export function usePagePermissionMembersQuery(pageId: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ["page-permission-members", pageId],
    queryFn: ({ pageParam }) =>
      getPagePermissionMembers(pageId, { cursor: pageParam, limit: 50 }),
    enabled: enabled && !!pageId,
    placeholderData: keepPreviousData,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.nextCursor : undefined,
  });
}

export function useEnablePagePermissionsMutation() {
  const invalidate = useInvalidatePagePermissions();
  const { t } = useTranslation();

  return useMutation<void, Error, string>({
    mutationFn: (pageId) => enablePagePermissions(pageId),
    onSuccess: async (_, pageId) => {
      notifications.show({ message: t("Page permissions enabled") });
      await invalidate(pageId);
    },
    onError: (error) => {
      notifications.show({
        message:
          error?.["response"]?.data?.message ||
          t("Failed to enable page permissions"),
        color: "red",
      });
    },
  });
}

export function useDisablePagePermissionsMutation() {
  const invalidate = useInvalidatePagePermissions();
  const { t } = useTranslation();

  return useMutation<void, Error, string>({
    mutationFn: (pageId) => disablePagePermissions(pageId),
    onSuccess: async (_, pageId) => {
      notifications.show({ message: t("Page permissions disabled") });
      await invalidate(pageId);
    },
    onError: (error) => {
      notifications.show({
        message:
          error?.["response"]?.data?.message ||
          t("Failed to disable page permissions"),
        color: "red",
      });
    },
  });
}

export function useAddPagePermissionMembersMutation() {
  const invalidate = useInvalidatePagePermissions();
  const { t } = useTranslation();

  return useMutation<void, Error, AddPagePermissionMembersInput>({
    mutationFn: addPagePermissionMembers,
    onSuccess: async (_, variables) => {
      notifications.show({ message: t("Page permissions updated") });
      await invalidate(variables.pageId);
    },
    onError: (error) => {
      notifications.show({
        message:
          error?.["response"]?.data?.message ||
          t("Failed to update page permissions"),
        color: "red",
      });
    },
  });
}

export function useChangePagePermissionRoleMutation() {
  const invalidate = useInvalidatePagePermissions();
  const { t } = useTranslation();

  return useMutation<void, Error, ChangePagePermissionRoleInput>({
    mutationFn: changePagePermissionRole,
    onSuccess: async (_, variables) => {
      await invalidate(variables.pageId);
    },
    onError: (error) => {
      notifications.show({
        message:
          error?.["response"]?.data?.message ||
          t("Failed to change page permission"),
        color: "red",
      });
    },
  });
}

export function useRemovePagePermissionMemberMutation() {
  const invalidate = useInvalidatePagePermissions();
  const { t } = useTranslation();

  return useMutation<void, Error, RemovePagePermissionMemberInput>({
    mutationFn: removePagePermissionMember,
    onSuccess: async (_, variables) => {
      await invalidate(variables.pageId);
    },
    onError: (error) => {
      notifications.show({
        message:
          error?.["response"]?.data?.message ||
          t("Failed to remove page permission"),
        color: "red",
      });
    },
  });
}
