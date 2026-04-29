# Docmost Personal Workspace

This repository is my personal Docmost-based knowledge workspace. It keeps the collaboration, wiki, page editing, sharing, permissions, and deployment workflows that I use, with project-facing docs focused on local development and self-hosted use.

## What This Project Includes

- Real-time collaborative pages and spaces.
- Groups, members, comments, search, attachments, and page history.
- Self-developed community features under `apps/client/src/features/community` and `apps/server/src/community`.
- Docker-based local/self-hosted deployment.

## Local Development

```powershell
pnpm.cmd install --frozen-lockfile
pnpm.cmd run dev
```

Build individual apps:

```powershell
pnpm.cmd run client:build
pnpm.cmd run server:build
```

Run with Docker:

```powershell
docker compose up -d
```

## Project Notes

- This is maintained as a personal project for self-hosted use.
- New self-developed functionality should be implemented in the `community` namespaces.
- Avoid coupling personal features to unused upstream modules.
- Keep deployment secrets in `.env`; do not commit private keys, tokens, or production credentials.

## License

See `LICENSE` for the open-source license text included with this repository. Additional third-party or upstream files may retain their original notices where applicable.
