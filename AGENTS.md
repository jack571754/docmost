# Repository Guidelines

## Project Structure & Module Organization

Docmost is a pnpm/Nx monorepo. Main applications live in `apps/`: `apps/client` is the React/Vite frontend and `apps/server` is the NestJS backend. Shared editor code is in `packages/editor-ext`; enterprise-only code is separated under `packages/ee` and `apps/client/src/ee`. Client assets are in `apps/client/public`, while backend tests live under `apps/server/test` and unit specs are colocated in `apps/server/src` as `*.spec.ts`. Community/self-developed features should use `apps/client/src/features/community` and `apps/server/src/community`.

## Build, Test, and Development Commands

- `pnpm.cmd install --frozen-lockfile` installs workspace dependencies.
- `pnpm.cmd run dev` runs frontend and backend together.
- `pnpm.cmd run client:dev` starts the Vite client only.
- `pnpm.cmd run server:dev` starts the NestJS API in watch mode.
- `pnpm.cmd run build` builds all Nx projects.
- `pnpm.cmd run client:build` and `pnpm.cmd run server:build` build one app.
- `cd apps/server; pnpm.cmd test` runs backend unit tests.
- `cd apps/server; pnpm.cmd test:e2e` runs backend e2e tests.
- `docker compose up -d` starts the local Docker stack when Docker is available.

## Coding Style & Naming Conventions

Use TypeScript throughout. Follow existing formatting: two-space indentation, single quotes and trailing commas in server/editor Prettier configs. Client code uses ESLint with React Hooks and TanStack Query rules; server code uses ESLint plus Prettier. Prefer kebab-case filenames for React components and feature files, PascalCase for React component exports, and `*.module.ts`, `*.service.ts`, `*.controller.ts` for NestJS modules.

## Testing Guidelines

Backend tests use Jest with `*.spec.ts` naming under `apps/server/src`. E2E tests use `apps/server/test/jest-e2e.json`. Add tests for backend services, controllers, migrations, and permission-sensitive behavior. The client currently has build/lint validation; add focused tests only when introducing a test harness or following an existing local pattern.

## Commit & Pull Request Guidelines

This checkout has minimal history, so use concise imperative commits such as `Add community audit module` or `Fix static asset config injection`. PRs should include a short summary, affected areas, test/build commands run, linked issue if any, and screenshots for visible UI changes.

## Security & Agent-Specific Instructions

Do not bypass licensing or import/copy code from `apps/client/src/ee` or `packages/ee` into community features. Keep secrets in `.env`, not source. Before editing, check `git status`; preserve unrelated user changes. Prefer `rg` for searches and avoid destructive Git commands unless explicitly requested.
