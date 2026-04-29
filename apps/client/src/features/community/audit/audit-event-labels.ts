export const AUDIT_EVENT_LABELS: Record<string, string> = {
  "workspace.created": "Workspace created",
  "workspace.updated": "Workspace updated",
  "workspace.invite_created": "Workspace invite created",
  "workspace.invite_resent": "Workspace invite resent",
  "workspace.invite_revoked": "Workspace invite revoked",
  "user.created": "User created",
  "user.deleted": "User deleted",
  "user.login": "User logged in",
  "user.logout": "User logged out",
  "user.role_changed": "User role changed",
  "user.password_changed": "Password changed",
  "user.password_reset": "Password reset",
  "user.updated": "User updated",
  "user.deactivated": "User deactivated",
  "user.activated": "User activated",
  "api_key.created": "API key created",
  "api_key.updated": "API key updated",
  "api_key.deleted": "API key deleted",
  "space.created": "Space created",
  "space.updated": "Space updated",
  "space.deleted": "Space deleted",
  "space.member_added": "Space member added",
  "space.member_removed": "Space member removed",
  "space.member_role_changed": "Space member role changed",
  "group.created": "Group created",
  "group.updated": "Group updated",
  "group.deleted": "Group deleted",
  "group.member_added": "Group member added",
  "group.member_removed": "Group member removed",
  "comment.created": "Comment created",
  "comment.deleted": "Comment deleted",
  "comment.updated": "Comment updated",
  "comment.resolved": "Comment resolved",
  "comment.reopened": "Comment reopened",
  "page.created": "Page created",
  "page.trashed": "Page moved to trash",
  "page.deleted": "Page deleted",
  "page.restored": "Page restored",
  "page.moved_to_space": "Page moved to space",
  "page.duplicated": "Page duplicated",
  "page.restricted": "Page restricted",
  "page.restriction_removed": "Page restriction removed",
  "page.permission_added": "Page permission added",
  "page.permission_removed": "Page permission removed",
  "page.verification_created": "Page verification created",
  "page.verification_updated": "Page verification updated",
  "page.verification_removed": "Page verification removed",
  "page.verified": "Page verified",
  "page.approval_requested": "Page approval requested",
  "page.approval_rejected": "Page approval rejected",
  "page.marked_obsolete": "Page marked obsolete",
  "share.created": "Share created",
  "share.deleted": "Share deleted",
  "page.imported": "Page imported",
  "page.exported": "Page exported",
  "space.exported": "Space exported",
  "sso.provider_created": "SSO provider created",
  "sso.provider_updated": "SSO provider updated",
  "sso.provider_deleted": "SSO provider deleted",
  "user.mfa_enabled": "MFA enabled",
  "user.mfa_disabled": "MFA disabled",
  "user.mfa_backup_code_generated": "MFA backup codes generated",
  "attachment.uploaded": "Attachment uploaded",
};

export const AUDIT_RESOURCE_LABELS: Record<string, string> = {
  workspace: "Workspace",
  user: "User",
  page: "Page",
  space: "Space",
  space_member: "Space member",
  group: "Group",
  comment: "Comment",
  share: "Share",
  api_key: "API key",
  sso_provider: "SSO provider",
  workspace_invitation: "Workspace invitation",
  attachment: "Attachment",
};

export const AUDIT_EVENT_OPTIONS = Object.entries(AUDIT_EVENT_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export const AUDIT_RESOURCE_OPTIONS = Object.entries(AUDIT_RESOURCE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export function getAuditEventLabel(event: string): string {
  return AUDIT_EVENT_LABELS[event] ?? event;
}

export function getAuditResourceLabel(resourceType: string): string {
  return AUDIT_RESOURCE_LABELS[resourceType] ?? resourceType;
}
