import {
  keepPreviousData,
  useQuery,
  UseQueryResult,
} from "@tanstack/react-query";
import {
  getAuditLogs,
  getAuditRetention,
} from "@/features/community/audit/audit-service.ts";
import {
  AuditLogPagination,
  AuditLogQueryParams,
  AuditRetention,
} from "@/features/community/audit/types.ts";

export function useAuditLogsQuery(
  params?: AuditLogQueryParams,
): UseQueryResult<AuditLogPagination, Error> {
  return useQuery({
    queryKey: ["audit-logs", params],
    queryFn: () => getAuditLogs(params),
    placeholderData: keepPreviousData,
  });
}

export function useAuditRetentionQuery(): UseQueryResult<AuditRetention, Error> {
  return useQuery({
    queryKey: ["audit-retention"],
    queryFn: getAuditRetention,
    staleTime: 10 * 60 * 1000,
  });
}
