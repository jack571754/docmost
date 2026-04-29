# Community Features

Self-developed features for this personal project should live under `apps/client/src/features/community`.

Guidelines:

- Keep feature code independent from upstream proprietary modules.
- Pair each frontend feature with a matching backend module under `apps/server/src/community` when API support is needed.
- Prefer small, auditable modules with clear service, query, and type boundaries.
