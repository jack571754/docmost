# Personal Project Feature Notes

This document records the feature cleanup for this personal Docmost-based workspace. The goal is to keep the self-hosted knowledge-base workflow and keep project-facing docs focused on local development and personal use.

## Principles

- Treat this repository as a personal project.
- Put self-developed features under the `community` namespace.
- Keep personal features independent from unused upstream modules.
- Prefer lightweight replacements when a removed feature is useful later.

## Feature Status

### AI / AI Chat

Status: hidden.

- Removed AI routes from the main app.
- Removed AI settings entries.
- Removed the home-page AI prompt entry.

Future option: build a small local AI module under `apps/client/src/features/community/ai` and `apps/server/src/community/ai` if needed.

### Templates

Status: hidden.

- Removed template list and editor routes.
- Removed template entry points from page import flows.

Future option: start with "save page as template" and "create page from template".

### API Keys

Status: hidden.

- Removed API key entries from account and workspace settings.
- Removed related prefetch hooks.

Future option: implement personal access tokens separately; store only hashed tokens.

### Audit Logs

Status: in progress.

- Backend now uses `CommunityAuditModule` and writes to the existing `audit` table.
- Frontend adds `/settings/audit`, visible to workspace owners only.
- Retention is fixed at 90 days.

Next focus: login, member changes, space changes, page deletion, share changes, and page permission changes.

### Product Plan Pages

Status: hidden.

- Removed product billing and edition-setting navigation.
- Removed product-plan and hosted-service wording from public project docs.

Future option: if version info is needed, add a simple personal "About" page showing build version and deployment notes.

### Security / SSO / MFA

Status: hidden.

- Removed Security / SSO settings navigation.
- Removed MFA challenge and forced setup routes.
- Removed MFA entry from account settings.

Future option: implement basic session management and password policy first; plan SSO and MFA separately.

### Page Verification

Status: hidden.

- Removed verified-page settings navigation.
- Removed related prefetch hooks.

Future option: implement a light page review status with reviewer and reviewed-at fields.

### Page Permissions

Status: implemented as a community feature.

- Supports restricted pages.
- Child pages inherit parent restrictions.
- Users and groups can receive reader or writer access.
- Chinese UI strings are available for the permission modal.

Future option: add batch grants, clearer conflict messages, and audit integration.

### PDF Export / Render

Status: hidden.

- Removed PDF render route.
- Removed related client references.

Future option: use a separate Playwright-based export worker.

### Hosted-Service-Only Pages

Status: hidden.

- Removed hosted workspace creation, selection, and email-verification pages.
- Kept the self-hosted setup flow at `/setup/register`.

## Kept Core Capabilities

- Workspace setup, login, invites, and password reset.
- Home, spaces, page editing, favorites, and trash.
- Members, groups, spaces, and public sharing.
- Uploads, comments, search, and page history.
- Docker self-hosted deployment.

## Development Locations

Frontend:

```text
apps/client/src/features/community
```

Backend:

```text
apps/server/src/community
```

Keep each self-developed feature split into clear module, controller, service, type, and query/service files.

## Checks

```powershell
rg -n "@/ee|useHasFeature|entitlementAtom|useEntitlements" apps/client/src -g "!apps/client/src/ee/**"
pnpm.cmd run client:build
pnpm.cmd run server:build
```
