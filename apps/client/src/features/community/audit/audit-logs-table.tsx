import {
  Badge,
  Code,
  Collapse,
  Group,
  Table,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { IconChevronDown, IconHistory } from "@tabler/icons-react";
import { format } from "date-fns";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import NoTableResults from "@/components/common/no-table-results.tsx";
import Paginate from "@/components/common/paginate.tsx";
import { CustomAvatar } from "@/components/ui/custom-avatar.tsx";
import { AuditLogPagination } from "@/features/community/audit/types.ts";
import {
  getAuditEventLabel,
  getAuditResourceLabel,
} from "@/features/community/audit/audit-event-labels.ts";
import classes from "./audit-logs.module.css";

type AuditLogsTableProps = {
  data?: AuditLogPagination;
  isLoading?: boolean;
  onNext: (cursor?: string | null) => void;
  onPrev: () => void;
};

export default function AuditLogsTable({
  data,
  isLoading,
  onNext,
  onPrev,
}: AuditLogsTableProps) {
  const { t } = useTranslation();
  const logs = data?.items ?? [];

  return (
    <>
      <Table.ScrollContainer minWidth={860}>
        <Table highlightOnHover verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t("Actor")}</Table.Th>
              <Table.Th>{t("Event")}</Table.Th>
              <Table.Th>{t("Resource")}</Table.Th>
              <Table.Th>{t("IP address")}</Table.Th>
              <Table.Th>{t("Date")}</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {!isLoading && logs.length === 0 && <NoTableResults colSpan={6} />}
            {logs.map((log) => (
              <AuditLogRow key={log.id} log={log} />
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      {logs.length > 0 && (
        <Paginate
          hasPrevPage={data?.meta?.hasPrevPage}
          hasNextPage={data?.meta?.hasNextPage}
          onNext={() => onNext(data?.meta?.nextCursor)}
          onPrev={onPrev}
        />
      )}
    </>
  );
}

function AuditLogRow({ log }: { log: AuditLogPagination["items"][number] }) {
  const { t } = useTranslation();
  const [opened, setOpened] = useState(false);
  const hasDetails = !!log.changes || !!log.metadata;

  return (
    <>
      <Table.Tr>
        <Table.Td>
          {log.actor ? (
            <Group gap="xs" wrap="nowrap">
              <CustomAvatar
                avatarUrl={log.actor.avatarUrl}
                name={log.actor.name}
                size="sm"
              />
              <div style={{ minWidth: 0 }}>
                <Text size="sm" fw={500} lineClamp={1}>
                  {log.actor.name}
                </Text>
                <Text size="xs" c="dimmed" lineClamp={1}>
                  {log.actor.email}
                </Text>
              </div>
            </Group>
          ) : (
            <Group gap="xs" wrap="nowrap">
              <IconHistory size={18} />
              <Text size="sm">{t(log.actorType === "system" ? "System" : "Unknown actor")}</Text>
            </Group>
          )}
        </Table.Td>
        <Table.Td>
          <Badge variant="light">{t(getAuditEventLabel(log.event))}</Badge>
        </Table.Td>
        <Table.Td>
          <div className={classes.resourceText}>
            <Text size="sm" fw={500} lineClamp={1}>
              {log.resource?.name ?? log.resourceId ?? "-"}
            </Text>
            <Text size="xs" c="dimmed" lineClamp={1}>
              {t(getAuditResourceLabel(log.resourceType))}
            </Text>
          </div>
        </Table.Td>
        <Table.Td>
          <Text size="sm" c="dimmed" style={{ whiteSpace: "nowrap" }}>
            {log.ipAddress ?? "-"}
          </Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm" style={{ whiteSpace: "nowrap" }}>
            {format(new Date(log.createdAt), "yyyy-MM-dd HH:mm")}
          </Text>
        </Table.Td>
        <Table.Td>
          {hasDetails && (
            <UnstyledButton onClick={() => setOpened((value) => !value)}>
              <Group gap={4} wrap="nowrap">
                <Text size="sm" c="blue">
                  {t("Details")}
                </Text>
                <IconChevronDown
                  size={14}
                  color="var(--mantine-color-blue-6)"
                  style={{
                    transform: opened ? "rotate(180deg)" : undefined,
                    transition: "transform 120ms ease",
                  }}
                />
              </Group>
            </UnstyledButton>
          )}
        </Table.Td>
      </Table.Tr>
      {hasDetails && (
        <Table.Tr>
          <Table.Td colSpan={6} p={0}>
            <Collapse in={opened}>
              <Group align="flex-start" gap="md" p="sm">
                {log.changes && (
                  <DetailBlock title={t("Changes")} value={log.changes} />
                )}
                {log.metadata && (
                  <DetailBlock title={t("Metadata")} value={log.metadata} />
                )}
              </Group>
            </Collapse>
          </Table.Td>
        </Table.Tr>
      )}
    </>
  );
}

function DetailBlock({
  title,
  value,
}: {
  title: string;
  value: Record<string, unknown>;
}) {
  return (
    <div style={{ flex: 1, minWidth: 280 }}>
      <Text size="xs" fw={600} mb={4}>
        {title}
      </Text>
      <Code block className={classes.jsonBlock}>
        {JSON.stringify(value, null, 2)}
      </Code>
    </div>
  );
}
