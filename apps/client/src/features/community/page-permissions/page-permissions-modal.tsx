import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Divider,
  Group,
  Loader,
  Modal,
  Paper,
  Select,
  Stack,
  Text,
} from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CustomAvatar } from "@/components/ui/custom-avatar.tsx";
import { IconGroupCircle } from "@/components/icons/icon-people-circle.tsx";
import { MultiMemberSelect } from "@/features/space/components/multi-member-select.tsx";
import {
  PagePermissionMember,
  PagePermissionRole,
} from "@/features/community/page-permissions/types.ts";
import {
  useAddPagePermissionMembersMutation,
  useChangePagePermissionRoleMutation,
  useDisablePagePermissionsMutation,
  useEnablePagePermissionsMutation,
  usePagePermissionMembersQuery,
  usePagePermissionsInfoQuery,
  useRemovePagePermissionMemberMutation,
} from "@/features/community/page-permissions/page-permissions-query.ts";

type PagePermissionsModalProps = {
  pageId: string;
  opened: boolean;
  onClose: () => void;
};

const roleOptions = [
  {
    value: PagePermissionRole.Reader,
    label: "Reader",
  },
  {
    value: PagePermissionRole.Writer,
    label: "Writer",
  },
];

export default function PagePermissionsModal({
  pageId,
  opened,
  onClose,
}: PagePermissionsModalProps) {
  const { t } = useTranslation();
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [role, setRole] = useState<PagePermissionRole>(
    PagePermissionRole.Reader,
  );
  const infoQuery = usePagePermissionsInfoQuery(pageId, opened);
  const membersQuery = usePagePermissionMembersQuery(
    pageId,
    opened && !!infoQuery.data?.hasDirectRestriction,
  );
  const enableMutation = useEnablePagePermissionsMutation();
  const disableMutation = useDisablePagePermissionsMutation();
  const addMembersMutation = useAddPagePermissionMembersMutation();

  const info = infoQuery.data;
  const members =
    membersQuery.data?.pages.flatMap((page) => page.items) ??
    info?.members?.items ??
    [];

  const handleAddMembers = async () => {
    await addMembersMutation.mutateAsync({
      pageId,
      memberIds,
      role,
    });
    setMemberIds([]);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t("Page permissions")}
      size="lg"
    >
      <Stack gap="md">
        {infoQuery.isLoading && (
          <Group justify="center" py="xl">
            <Loader size="sm" />
          </Group>
        )}

        {info && (
          <>
            <PermissionStatus
              hasDirectRestriction={info.hasDirectRestriction}
              hasInheritedRestriction={info.hasInheritedRestriction}
            />

            {!info.canManage && (
              <Alert color="gray">
                {t("You can view these settings, but cannot manage them.")}
              </Alert>
            )}

            {!info.hasDirectRestriction ? (
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  {t(
                    "Enable restrictions to grant this page to specific users and groups.",
                  )}
                </Text>
                <Button
                  disabled={!info.canManage}
                  loading={enableMutation.isPending}
                  onClick={() => enableMutation.mutate(pageId)}
                >
                  {t("Enable restrictions")}
                </Button>
              </Group>
            ) : (
              <>
                {info.canManage && (
                  <>
                    <Stack gap="xs">
                      <MultiMemberSelect
                        value={memberIds}
                        onChange={setMemberIds}
                      />
                      <Select
                        label={t("Role")}
                        data={roleOptions.map((item) => ({
                          value: item.value,
                          label: t(item.label),
                        }))}
                        value={role}
                        allowDeselect={false}
                        onChange={(value) =>
                          setRole(value as PagePermissionRole)
                        }
                      />
                      <Group justify="flex-end">
                        <Button
                          disabled={memberIds.length === 0}
                          loading={addMembersMutation.isPending}
                          onClick={handleAddMembers}
                        >
                          {t("Add")}
                        </Button>
                      </Group>
                    </Stack>
                    <Divider />
                  </>
                )}

                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text fw={500}>{t("Members with access")}</Text>
                    <Button
                      variant="subtle"
                      color="red"
                      disabled={!info.canManage}
                      loading={disableMutation.isPending}
                      onClick={() => disableMutation.mutate(pageId)}
                    >
                      {t("Disable restrictions")}
                    </Button>
                  </Group>

                  {members.length === 0 ? (
                    <Text size="sm" c="dimmed">
                      {t("No members have been added yet.")}
                    </Text>
                  ) : (
                    members.map((member) => (
                      <PermissionMemberRow
                        key={`${member.type}-${member.id}`}
                        pageId={pageId}
                        member={member}
                        canManage={info.canManage}
                      />
                    ))
                  )}

                  {membersQuery.hasNextPage && (
                    <Button
                      variant="light"
                      loading={membersQuery.isFetchingNextPage}
                      onClick={() => membersQuery.fetchNextPage()}
                    >
                      {t("Load more")}
                    </Button>
                  )}
                </Stack>
              </>
            )}
          </>
        )}
      </Stack>
    </Modal>
  );
}

function PermissionStatus({
  hasDirectRestriction,
  hasInheritedRestriction,
}: {
  hasDirectRestriction: boolean;
  hasInheritedRestriction: boolean;
}) {
  const { t } = useTranslation();

  if (hasDirectRestriction) {
    return (
      <Alert color="blue">
        {t("This page is restricted. Child pages inherit this restriction.")}
      </Alert>
    );
  }

  if (hasInheritedRestriction) {
    return (
      <Alert color="yellow">
        {t("This page is restricted by a parent page.")}
      </Alert>
    );
  }

  return (
    <Alert color="gray">
      {t("This page currently uses space permissions.")}
    </Alert>
  );
}

function PermissionMemberRow({
  pageId,
  member,
  canManage,
}: {
  pageId: string;
  member: PagePermissionMember;
  canManage: boolean;
}) {
  const { t } = useTranslation();
  const changeRoleMutation = useChangePagePermissionRoleMutation();
  const removeMemberMutation = useRemovePagePermissionMemberMutation();
  const memberId = `${member.type}-${member.id}`;

  return (
    <Paper withBorder p="sm">
      <Group justify="space-between" wrap="nowrap">
        <Group gap="sm" wrap="nowrap" miw={0}>
          {member.type === "user" ? (
            <CustomAvatar
              avatarUrl={member.avatarUrl}
              name={member.name}
              size={32}
            />
          ) : (
            <IconGroupCircle />
          )}

          <div style={{ minWidth: 0 }}>
            <Group gap="xs">
              <Text size="sm" fw={500} truncate="end">
                {member.name}
              </Text>
              <Badge size="xs" variant="light">
                {member.type === "user" ? t("User") : t("Group")}
              </Badge>
            </Group>
            <Text size="xs" c="dimmed" truncate="end">
              {member.type === "user"
                ? member.email
                : t("{{count}} members", { count: member.memberCount ?? 0 })}
            </Text>
          </div>
        </Group>

        <Group gap="xs" wrap="nowrap">
          <Select
            size="xs"
            w={120}
            data={roleOptions.map((item) => ({
              value: item.value,
              label: t(item.label),
            }))}
            value={member.role}
            disabled={!canManage}
            allowDeselect={false}
            onChange={(value) => {
              if (!value || value === member.role) return;
              changeRoleMutation.mutate({
                pageId,
                memberId,
                role: value as PagePermissionRole,
              });
            }}
          />
          <ActionIcon
            variant="subtle"
            color="red"
            disabled={!canManage}
            loading={removeMemberMutation.isPending}
            onClick={() =>
              removeMemberMutation.mutate({
                pageId,
                memberId,
              })
            }
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Group>
    </Paper>
  );
}
