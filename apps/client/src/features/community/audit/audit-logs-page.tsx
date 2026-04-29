import { Alert, Button, Group, Select, Text } from "@mantine/core";
import { IconHistory, IconInfoCircle } from "@tabler/icons-react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import SettingsTitle from "@/components/settings/settings-title.tsx";
import { getAppName } from "@/lib/config.ts";
import { useCursorPaginate } from "@/hooks/use-cursor-paginate";
import {
  AUDIT_EVENT_OPTIONS,
  AUDIT_RESOURCE_OPTIONS,
} from "@/features/community/audit/audit-event-labels.ts";
import {
  useAuditLogsQuery,
  useAuditRetentionQuery,
} from "@/features/community/audit/audit-query.ts";
import AuditLogsTable from "@/features/community/audit/audit-logs-table.tsx";
import classes from "./audit-logs.module.css";
import { useMemo, useState } from "react";

export default function AuditLogsPage() {
  const { t } = useTranslation();
  const { cursor, goNext, goPrev, resetCursor } = useCursorPaginate();
  const [event, setEvent] = useState<string | null>(null);
  const [resourceType, setResourceType] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const params = useMemo(
    () => ({
      cursor,
      limit: 50,
      event: event || undefined,
      resourceType: resourceType || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
    [cursor, event, resourceType, startDate, endDate],
  );
  const logsQuery = useAuditLogsQuery(params);
  const retentionQuery = useAuditRetentionQuery();

  const updateFilter = (updater: () => void) => {
    updater();
    resetCursor();
  };

  return (
    <>
      <Helmet>
        <title>
          {t("Audit log")} - {getAppName()}
        </title>
      </Helmet>
      <SettingsTitle title={t("Audit log")} />

      <Alert
        mb="md"
        variant="light"
        color="blue"
        icon={<IconInfoCircle />}
      >
        {t("Audit logs are visible to workspace owners only. Logs are retained for {{days}} days.", {
          days: retentionQuery.data?.retentionDays ?? 90,
        })}
      </Alert>

      <div className={classes.filterBar}>
        <Select
          label={t("Filter by event")}
          data={AUDIT_EVENT_OPTIONS.map((item) => ({
            value: item.value,
            label: t(item.label),
          }))}
          value={event}
          searchable
          clearable
          onChange={(value) => updateFilter(() => setEvent(value))}
        />
        <Select
          label={t("Filter by resource")}
          data={AUDIT_RESOURCE_OPTIONS.map((item) => ({
            value: item.value,
            label: t(item.label),
          }))}
          value={resourceType}
          searchable
          clearable
          onChange={(value) => updateFilter(() => setResourceType(value))}
        />
        <TextInputLikeDate
          label={t("Start date")}
          value={startDate}
          onChange={(value) => updateFilter(() => setStartDate(value))}
        />
        <TextInputLikeDate
          label={t("End date")}
          value={endDate}
          onChange={(value) => updateFilter(() => setEndDate(value))}
        />
        <Button
          variant="default"
          onClick={() =>
            updateFilter(() => {
              setEvent(null);
              setResourceType(null);
              setStartDate("");
              setEndDate("");
            })
          }
        >
          {t("Reset")}
        </Button>
      </div>

      <Group mt="md" mb="xs" justify="space-between">
        <Group gap="xs">
          <IconHistory size={18} />
          <Text fw={500}>{t("Events")}</Text>
        </Group>
      </Group>

      <AuditLogsTable
        data={logsQuery.data}
        isLoading={logsQuery.isLoading}
        onNext={goNext}
        onPrev={goPrev}
      />
    </>
  );
}

function TextInputLikeDate({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <Text size="sm" fw={500} mb={5}>
        {label}
      </Text>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        style={{
          width: "100%",
          height: 36,
          border: "1px solid var(--mantine-color-gray-4)",
          borderRadius: "var(--mantine-radius-sm)",
          paddingInline: "var(--mantine-spacing-sm)",
          background: "var(--mantine-color-body)",
          color: "var(--mantine-color-text)",
        }}
      />
    </label>
  );
}
