import { IPagination, QueryParams } from "@/lib/types.ts";

export type AuditActor = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
};

export type AuditResource = {
  id: string;
  name: string;
  slug?: string;
  slugId?: string;
};

export type AuditChanges = {
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
};

export type AuditLog = {
  id: string;
  workspaceId: string;
  actorId?: string;
  actorType: "user" | "system" | "api_key" | string;
  event: string;
  resourceType: string;
  resourceId?: string;
  spaceId?: string;
  changes?: AuditChanges;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
  actor?: AuditActor;
  resource?: AuditResource;
};

export type AuditLogQueryParams = QueryParams & {
  event?: string;
  resourceType?: string;
  actorId?: string;
  spaceId?: string;
  startDate?: string;
  endDate?: string;
};

export type AuditLogPagination = IPagination<AuditLog>;

export type AuditRetention = {
  retentionDays: number;
};
