# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Livin** is a pet/plant-sitter matching platform. Owners post care jobs; caretakers browse and apply. A dating-app-style matching flow (swipe or social) connects the two sides, opens a temporary chat, and leads to a confirmed job.

The repo is an **npm workspace** with three packages:
- `backend/` — Express 5 + Prisma 7 + PostgreSQL
- `frontend/` — Angular 21 (standalone components) + NgRx 21
- `common/` — shared TypeScript types only (no runtime logic)

## Commands

All commands run from the repo root unless noted.

### Development

```bash
npm run dev:backend      # tsx watch — hot-reloads on save
npm run dev:frontend     # ng serve on http://localhost:4200
```

Both need to run in parallel. The database must be up first:

```bash
docker compose up -d db  # start only Postgres (port 5433)
```

### Full stack via Docker

```bash
cp .env.example .env     # once — then fill in secrets
docker compose up -d     # db + backend (3000) + frontend (80)
```

### Build

```bash
npm run build            # builds both backend (tsc → dist/) and frontend (ng build)
```

### Tests (frontend only — no backend tests yet)

```bash
cd frontend && npm test           # run all specs via Vitest + Angular TestBed
cd frontend && npm test -- --reporter=verbose  # with test names
```

Specs live in `frontend/src/**/*.spec.ts`. The test runner is **Vitest** (not Karma), configured through `angular.json` → `@angular/build:unit-test`.

### Prisma

Always run these from `backend/`:

```bash
npx prisma generate          # after pulling schema changes
npx prisma migrate dev       # apply schema changes to local DB
npx prisma migrate deploy    # apply in production/Docker
npx prisma studio            # visual DB browser on :5555
```

`prisma.config.ts` at `backend/prisma.config.ts` points Prisma CLI at the root `.env` and the schema in `backend/prisma/schema.prisma`.

### common package

`frontend/` and `backend/` both import from `@livin/common`, which resolves to `common/dist/`. After editing `common/src/index.ts`, rebuild it:

```bash
cd common && npm run build   # tsc → common/dist/
```

The frontend `tsconfig.json` maps `@livin/common` to `../common/dist` (not `node_modules`), so the compiled output must exist.

## Architecture

### Request lifecycle (backend)

```
HTTP request
  → Helmet / CORS / cookie-parser / Morgan (app.ts)
  → requireAuth (reads livin_token cookie → JWT verify → prisma.user.findUnique → req.user)
  → validate(zodSchema) (safeParse req.body → 400 on failure)
  → route handler
  → errorHandler (global, last middleware)
```

Auth is **cookie-only** (`httpOnly`, `SameSite: lax`). There is no Authorization header path. The cookie name is `livin_token`. All requests from the frontend must include `withCredentials: true`.

`req.user` is populated by `requireAuth` and carries the full User row minus `passwordHash`. Routes that need it can read it directly — no second DB query needed.

`ownershipGuard(model)` is a factory middleware used on `PUT`/`DELETE` routes for pets, plants, and stray animals to assert the caller owns the record.

### Route → app.ts wiring

```
/api/health        — no auth
/api/auth/*        — rate-limited (10/15 min), no requireAuth (register/login handle their own)
/api/users/*       — requireAuth applied at router level
/api/pets          — requireAuth at router level
/api/plants        — requireAuth at router level
/api/stray-animals — requireAuth at router level
/api/jobs          — requireAuth at router level
```

Body limit is **10 MB** (raised from the default to accommodate base64-encoded profile photos).

### Prisma usage

A single shared `PrismaClient` instance is exported from `backend/src/lib/prisma.ts` using the `PrismaPg` driver adapter (raw `pg` pool, not the default binary engine). Import it everywhere with:

```ts
import { prisma } from '../lib/prisma.js';
```

All imports in backend source use `.js` extensions (NodeNext module resolution).

### Frontend architecture

**Standalone components only** — no `NgModule`. Each feature is lazy-loaded via `loadComponent` in `app.routes.ts`.

**NgRx store** holds one slice: `user` (registration funnel state). It is only used during the 4-step registration flow to carry partial form data across route navigations. After registration the store is not the source of truth — `AuthService.user` signal is.

**`AuthService`** (singleton, `providedIn: 'root'`) owns the `currentUser` signal. The `authGuard` checks `isLoggedIn()` (signal-derived computed) and falls back to `GET /api/auth/me` on hard refresh.

**`HomeDataService`** is provided at the `Home` component level (not root), so it is destroyed and re-created on each navigation to `/home`.

**Google Maps** is loaded globally in `AppComponent`. The root `app.html` renders a `<google-map>` that is hidden on `/register` and `/jobs` (which manage their own map instances). The `/jobs` page creates its own `<google-map>` + Places Autocomplete independently.

### Environment / config

| File | Purpose |
|------|---------|
| `.env` (root) | Backend runtime + Docker compose vars |
| `frontend/src/environments/environment.local.ts` | Frontend dev config (gitignored) |
| `frontend/src/environments/environment.template.ts` | Template to copy from |

Backend config is validated at startup via a Zod schema in `backend/src/config/env.ts`. Missing or invalid vars throw immediately. `JWT_EXPIRES_IN` must be a plain integer (seconds), not a string like `"7d"`.

Frontend `apiUrl` must match the backend port (`localhost:3000` in dev). The template defaults to 3000.

### Error response shapes

Backend returns two different shapes depending on where the error originates:

- **Zod validation failure** (`validate` middleware): `{ error: 'Validation failed', details: ZodIssue[] }` — status 400
- **Business logic / auth errors**: `{ error: string }` — various status codes
- **Global error handler**: `{ message: string }` — status 500 (or status from `err.statusCode`)

Frontend error extraction should check `err.error?.error || err.error?.message` to cover both shapes.

### Adding a new backend route

1. Create `backend/src/routes/thing.routes.ts` with an Express `Router`.
2. Add a Zod schema in `backend/src/validators/` if the route accepts a body.
3. Wire it in `backend/src/app.ts`: `app.use('/api/thing', requireAuth, thingRouter)`.
4. If the route returns user data, select only public fields (see `PUBLIC_USER_SELECT` pattern in `users.routes.ts` and `job.routes.ts` — never return `passwordHash`, `email`, or `phone` on public-facing endpoints).
5. Add corresponding types to `common/src/index.ts` and rebuild common.
6. Add a service in `frontend/src/app/services/` following the `withCredentials: true` pattern.

### Schema change workflow

1. Edit `backend/prisma/schema.prisma`.
2. `cd backend && npx prisma migrate dev --name describe_change`.
3. `npx prisma generate` (updates the client types).
4. Update `common/src/index.ts` if shared types change, then `cd common && npm run build`.
5. Restart the backend dev server (`tsx watch` picks up `.ts` changes but not Prisma client regeneration).
