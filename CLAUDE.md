# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**GARealState** — an enterprise AI copilot for GA RealState certification agents. Agents use to get real-time guidance: QA coaching, and training simulations.

---

## Commands

```bash
# Development
npm run dev              # Start Next.js dev server on :3000
npm run type-check       # TypeScript type check (no emit)
npm run lint             # ESLint via next lint

# Database (reads .env.local)
npm run db:push          # Push Prisma schema to DB (no migrations)
npm run db:seed          # Seed demo users and KB articles
npm run db:studio        # Open Prisma Studio UI
npm run db:reset         # db:push + db:seed (wipe and reseed)
npm run setup            # Full first-time setup: install + db:push + db:seed

# Production
npm run build            # prisma generate + next build
npm run start            # Start production server

# Electron (desktop app wrapper)
npm run electron:start   # Dev: runs Next.js + Electron together
npm run electron:build:win  # Build Windows installer (.exe)
```

**Demo credentials** (after seeding):
| Role | Email | Password |
|------|-------|----------|
| Agent | `demo@RealState.ai` | `demo1234` |
| Supervisor | `supervisor@RealState.ai` | `demo1234` |
| Admin | `admin@RealState.ai` | `demo1234` |

---

## Architecture

This is a **single Next.js 14 (App Router) monolith** — not a monorepo. The frontend and backend API routes live in the same app. The Electron shell (`electron/main.js`) wraps this Next.js app for the desktop build.

```
src/
  app/
    (auth)/         # Login and register pages (unauthenticated)
    (dashboard)/    # Protected pages: copilot, dashboard, analytics,
                    # cases, knowledge, training, settings, admin
    api/
      ai/           # copilot, notebooklm, responses, training routes
      analytics/    # Dashboard metrics
      auth/         # NextAuth + register
      cases/        # Case CRUD + [id]
      knowledge/    # KB article CRUD
  components/
    copilot/        # CallFlowSimulator component
    layout/         # Header, Sidebar
    notebooklm/     # NotebookLMPanel
    ui/             # Shared UI primitives
  lib/
    ai/
      client.ts     # Core AI client (OpenRouter, model waterfall, JSON repair)
      models.ts     # FREE_MODELS list + DEFAULT_MODEL (browser-safe, no server imports)
      prompts.ts    # System prompts and prompt builders
      workflows.ts  # Structured RS troubleshooting workflows
      knowledge-base.ts  # KB search/retrieval logic
      kb/           # 13 static KB modules (banking, login, payroll, etc.)
    auth.ts         # NextAuth config + RBAC JWT callbacks
    db.ts           # Prisma client singleton
    utils/          # cn(), format helpers, rate limiter
  store/
    settings.ts     # Zustand store (client state: model selection, UI prefs)
  types/
    index.ts        # All shared types (CopilotInput, CopilotResponse, RS enums, etc.)
```

---

## AI Layer

**Provider: OpenRouter** (OpenAI-compatible endpoint), NOT the Anthropic API directly.

Despite env var names containing `ANTHROPIC`, the AI calls go to OpenRouter via `fetch` to `/v1/chat/completions`.

| Env var | Purpose |
|---|---|
| `ANTHROPIC_AUTH_TOKEN` | OpenRouter API key (primary) |
| `ANTHROPIC_API_KEY` | Fallback key name |
| `ANTHROPIC_BASE_URL` | Base URL (default: `https://openrouter.ai/api`) |
| `ANTHROPIC_MODEL` / `AI_MODEL` | Model override (default: `deepseek/deepseek-v4-flash:free`) |

**Model waterfall** (`src/lib/ai/client.ts`): tries the configured primary model, then falls back through `FALLBACK_MODELS` (6 free OpenRouter models). On 429, retries once before moving to the next model. All fallbacks are free-tier OpenRouter models.

**Critical constraint**: `response_format: { type: "json_object" }` is intentionally NOT sent — most free OpenRouter models return 400 when it's present. JSON output is enforced via system prompt wording instead. The `extractJson()` function in `client.ts` repairs common LLM JSON defects (trailing commas, unclosed brackets, markdown fences, truncated output).

**`models.ts` must stay browser-safe** — no server-side imports. It exports only constants. The `@anthropic-ai/sdk` package is installed but the actual AI calls use plain `fetch`.

**Knowledge base** is implemented as static TypeScript modules in `src/lib/ai/kb/` — not a vector database. Each file exports structured article content for a RS issue domain.

---

## Database

- **Dev**: SQLite (`DATABASE_URL=file:./dev.db`)
- **Prod**: PostgreSQL (change `provider` in `prisma/schema.prisma` and update `DATABASE_URL`)
- Uses `npm run db:push` (not `migrate`) for schema sync — no migration history
- All DB calls use env from `.env.local` (not `.env`)

Key models: `User`, `Case`, `CaseActivity`, `AISession`, `KBArticle`, `TrainingSession`, `QAScore`, `AuditLog`

RBAC roles stored as strings on `User.role`: `AGENT | SUPERVISOR | ADMIN`

---

## Auth

NextAuth with credentials provider + JWT sessions (8-hour expiry matching a work shift). The JWT and session callbacks attach `id` and `role` to the session. Session type is extended in `src/lib/auth.ts` to include `role`.

---

## Environment Setup

Create `.env.local` (never committed):
```env
ANTHROPIC_AUTH_TOKEN=sk-or-...    # OpenRouter API key
ANTHROPIC_BASE_URL=https://openrouter.ai/api
ANTHROPIC_MODEL=deepseek/deepseek-v4-flash:free
NEXTAUTH_SECRET=<random string>    # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:4000
DATABASE_URL="file:./dev.db"       # SQLite for dev
NEXT_PUBLIC_APP_NAME="GARealState"

# LiveKit (Breakroom voice/video/screen share)
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
LIVEKIT_URL=wss://...
NEXT_PUBLIC_LIVEKIT_URL=wss://...
```

LiveKit credentials are obtained from [cloud.livekit.io](https://cloud.livekit.io) → project → Settings → Keys.

---

## Key Conventions

- `CopilotInput` → `CopilotResponse` is the central data contract (defined in `src/types/index.ts`). `copilotDefaults()` in `client.ts` ensures all 20 response fields always have values so the UI never breaks on partial AI output.
- API routes authenticate via `getServerSession(authOptions)` before processing requests.
- The Zustand store (`src/store/settings.ts`) holds UI-only state like the selected AI model — this is what the Settings page writes to.
- Rate limiting is implemented in `src/lib/utils/rate-limit.ts` and applied in AI API routes.
- All DB JSON fields (e.g. `CaseActivity.metadata`, `TrainingSession.messages`) are stored as serialized JSON strings (SQLite limitation).
