import api from "@/lib/api-client";
import {
  AuditLogPagination,
  AuditLogQueryParams,
  AuditRetention,
} from "@/features/community/audit/types.ts";

export async function getAuditLogs(
  params?: AuditLogQueryParams,
): Promise<AuditLogPagination> {
  const req = await api.post<AuditLogPagination>("/community/audit", params);
  return req.data;
}

export async function getAuditRetention(): Promise<AuditRetention> {
  const req = await api.post<AuditRetention>("/community/audit/retention");
  return req.data;
}
