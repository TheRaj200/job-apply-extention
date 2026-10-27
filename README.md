# AI Job Application Agent

A private-by-default personal job application assistant, structured as a modular monorepo. Phase 2 implements the single-user local profile and local resume storage APIs; later product features are introduced incrementally.

## Architecture

- `apps/extension`: Chrome Manifest V3 + React + TypeScript (Phase 4).
- `apps/dashboard`: React + TypeScript + Tailwind (Phase 5).
- `server`: Express API, business services, Prisma persistence, and backend-only integrations.
- `packages/shared`: reusable API contracts and Zod schemas; never put server secrets here.
- `tests`: cross-app/end-to-end tests.

The API binds only to `127.0.0.1`; this phase intentionally has no multi-user authentication. The profile and files are for the local machine's single user. Files are stored outside public directories under `server/.private-storage` by default (or `LOCAL_STORAGE_DIR`) and only retrieved through profile-scoped API routes. Do not forward the port or expose the process to a network.

## Requirements

- Node.js 20+
- npm 10+
- MySQL 8+

## Local setup

MySQL-compatible local database is required for profile and resume metadata. The XAMPP database was verified as MariaDB 10.4.32 listening on `127.0.0.1:3307`; this project’s Prisma MySQL connector successfully applied the schema migration there. The normal MySQL port is often `3306`, but use the actual port configured in XAMPP.

```powershell
npm install
Copy-Item .env.example .env
# Set DATABASE_URL to your local XAMPP/MariaDB database (XAMPP here uses port 3307).
npm run db:generate
npm run db:migrate --workspace @job-agent/server
npm run dev
```

On Windows PowerShell, set `DATABASE_URL` in `.env`, then run the npm commands above. The API listens on `http://127.0.0.1:3000`; `GET /health` does not require a live database.

The resume API accepts a multipart PDF field named `file`, with a 5 MiB limit. PDFs are checked by MIME type and `%PDF-` signature. Resume downloads are addressed by database ID and profile ownership; storage keys are never returned by API responses. There is no PDF text extraction yet: scanned and text PDFs alike remain unchanged, and the application does not auto-populate profile facts.

## Environment

See `.env.example`. `NODE_ENV`, `PORT`, `DATABASE_URL`, and `LOCAL_STORAGE_DIR` are validated at server startup using Zod. `LOCAL_STORAGE_DIR` defaults to `server/.private-storage`; choose a user-private directory outside the repository if preferred. AI and S3 variables remain unused placeholders. Keep `.env` untracked.

## Development commands

```sh
npm run dev
npm test
npm run typecheck
npm run lint
npm run format:check
npm run build
```

The Phase 2 schema migration is under `server/prisma/migrations`. For later model changes, create migrations with:

```sh
npm run db:migrate --workspace @job-agent/server -- --name descriptive_change
```

## Delivery plan

1. **Foundation:** workspace, TypeScript, Express, Prisma/MySQL, Zod environment validation, health route, test/lint/format tooling.
2. **Profile and files (current):** local single-profile API, relational profile records, and private filesystem PDF upload/download.
3. **Job and resume intelligence:** job records, evidence-grounded matching, resume rendering/versioning.
4. **Extension:** supported-page extraction and confidence-based user-controlled autofill.
5. **Dashboard:** profile, resume, saved job, application status, and settings UI.
6. **Hardening:** integration/E2E coverage, deployment guidance, and security review.

## Security limitations

Loopback binding is appropriate only for personal local use. Any public or multi-user deployment must add authentication and authorization on every operation, CSRF protections, strict origin policy, rate limiting, secure secret management, file malware/content scanning, operational backups, and a hardened storage permission/retention policy. The API is not safe to expose publicly in its current form.
