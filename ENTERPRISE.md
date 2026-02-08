# Enterprise-grade improvements for Reframe

Prioritized suggestions to make the app production-hardened, scalable, and maintainable. Each section is ordered by impact and feasibility.

---

## 1. Reliability & observability

### 1.1 Health check endpoint (quick win)
- **Why:** Load balancers and orchestrators (Kubernetes, Vercel) need a simple liveness/readiness probe.
- **What:** `GET /api/health` returning 200 when the app is up; optionally check DB and critical env.
- **Status:** Implemented in `app/api/health/route.ts`.

### 1.2 Error boundaries
- **Why:** Uncaught React errors otherwise take down the whole tree; users see a blank screen.
- **What:** Root `error.tsx` and `global-error.tsx`, plus optional segment-level `error.tsx` for key routes (e.g. Today, Coach).
- **Status:** Root error + global error added; add segment-level as needed.

### 1.3 Structured logging
- **Why:** Debugging and auditing in production; correlation IDs for tracing.
- **What:** Replace `console.log` with a small logger (e.g. Pino or a thin wrapper) that outputs JSON with level, message, requestId, and error stack. Use in API routes and critical paths.
- **Suggestion:** `lib/logger.ts` with `log.info`, `log.error`, and optional integration to Datadog/Logtail.

### 1.4 Centralized API error handling
- **Why:** Consistent JSON error shape and status codes; avoid leaking internals; one place to log.
- **What:** A helper (e.g. `handleApiRoute(handler)`) that wraps route logic in try/catch, returns `{ error: string }` with 4xx/5xx, and logs 5xx. Use in all API routes.
- **Status:** Pattern added in `lib/api-handler.ts`; migrate routes gradually.

### 1.5 Monitoring & APM
- **Why:** Detect outages and slow endpoints before users complain.
- **What:** Vercel Analytics, or Sentry (errors + performance), or Datadog/New Relic. Add error boundary reporting to Sentry.

---

## 2. Security

### 2.1 Security headers (quick win)
- **Why:** Mitigate XSS, clickjacking, and enforce HTTPS.
- **What:** In `next.config.mjs`: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and optionally `Content-Security-Policy` (CSP). For strict CSP, start in report-only mode.
- **Status:** Headers added in `next.config.mjs`.

### 2.2 Request validation on all API routes
- **Why:** Malformed or oversized payloads can cause 500s or security issues; validate with Zod (you already use it in coach).
- **What:** Define Zod schemas for every POST/PUT body and parse with `.safeParse()`; return 400 with validation errors. Apply size limits (e.g. `body.byteLength`) before parsing.
- **Gap:** Routes like `checkins`, `thought-records`, `profile` accept raw `request.json()` without schemas.

### 2.3 Rate limiting
- **Current:** In-memory rate limiter in `lib/rateLimit.ts`; used in coach route.
- **Gap:** In-memory state is per-instance; under multiple replicas limits are not shared.
- **Suggestion:** Use a shared store (e.g. Upstash Redis, Vercel KV) for rate limit keys so limits apply across instances. Keep the same `checkRateLimit(key, rpm)` API and swap the backend.

### 2.4 Auth hardening
- **What:** Ensure all app API routes (except auth and health) call `getCurrentUserId()` and return 401 when missing. Middleware already protects pages; double-check API routes under `/api/user/*` and `/api/coach`.
- **Optional:** Session refresh strategy, CSRF if you add non-GET forms that change state (NextAuth handles session cookies; confirm same-site and secure in prod).

### 2.5 Secrets & env validation (quick win)
- **Why:** Failing fast at startup if `NEXTAUTH_SECRET` or `POSTGRES_URL` is missing avoids cryptic runtime errors.
- **What:** A small `lib/env.ts` that validates required env with Zod and exports typed `env`. Import in critical paths or in middleware/health so the app refuses to start when misconfigured. For production, add a strict schema that requires `NEXTAUTH_SECRET` and call `getEnv()` from middleware or health.
- **Status:** `lib/env.ts` added (lenient schema for local dev); optional use in health and middleware.

---

## 3. Data & compliance

### 3.1 Audit logging
- **Why:** Enterprises and compliance (e.g. SOC 2, HIPAA-lite) often need “who did what when.”
- **What:** Log sensitive actions (login, export, profile change, thought record create/delete) with userId, action, resource id, timestamp. Store in DB table or send to a log aggregate; avoid logging full request bodies or PII in plain text.

### 3.2 Data export & deletion
- **Current:** `GET /api/user/export` exists.
- **What:** Document data retention and ensure account deletion (or “delete my data”) removes or anonymizes user data and related rows (profile, checkins, thought records, etc.) and logs the event.

### 3.3 Encryption
- **What:** Data at rest: use your DB provider’s encryption. Data in transit: HTTPS only (enforce via headers and deployment). No need to store encrypted fields in app if DB and backups are encrypted.

---

## 4. Performance & scalability

### 4.1 Database
- **What:** Connection pooling (e.g. PgBouncer or serverless pool like Neon’s). Add indexes for common filters (e.g. `userId` + `createdAt` for checkins/thought-records). Prefer parameterized queries (Drizzle does this).

### 4.2 Caching
- **What:** Cache read-heavy, user-scoped data (e.g. profile, today summary) with short TTL (e.g. 60s) and invalidate on write. Use Next.js `unstable_cache` or a small Redis layer if you introduce it for rate limiting.

### 4.3 API response shape
- **What:** Keep JSON responses lean; avoid over-fetching. Consider `?fields=` or separate endpoints for heavy payloads (e.g. export).

---

## 5. Testing

### 5.1 Unit tests
- **What:** Vitest or Jest for pure logic: `lib/safety.ts`, `lib/rateLimit.ts`, validation schemas, and any business logic in lib.

### 5.2 API integration tests
- **What:** Hit real route handlers with mocked DB or test DB: auth required, validation errors, rate limit 429. Use a test runner that can start Next in test mode or call handlers directly.

### 5.3 E2E (optional)
- **What:** Playwright or Cypress for critical flows: signup → login → one check-in → one thought record. Run in CI on a staging URL.

---

## 6. Operations & DevOps

### 6.1 CI/CD
- **What:** On every PR: `npm run typecheck`, `npm run lint`, `npm run build`. Optional: run unit + integration tests. On merge to main: deploy to staging then production (Vercel does this if connected).

### 6.2 Feature flags
- **What:** For risky or gradual rollouts (e.g. new coach mode), use env or a simple feature-flag service so you can turn features off without a deploy.

### 6.3 Dependency and supply-chain security
- **What:** `npm audit` in CI; consider Dependabot or Renovate for updates. Pin major versions and review changelogs before upgrading.

---

## 7. Enterprise product features (later)

- **SSO / SAML / OIDC:** Allow organizations to sign in with their IdP (e.g. Okta, Azure AD). NextAuth supports many providers; add a “Sign in with your organization” path.
- **Multi-tenancy:** If you sell to teams, isolate data by `organizationId` and enforce it in every query.
- **Admin dashboard:** Read-only (or minimal) admin view for support: user list, last active, export status. Protect by role or separate admin app.
- **API for partners:** Versioned REST or GraphQL API with API keys and rate limits for B2B integrations.
- **SLAs and status page:** Public status page and defined uptime SLA when selling to enterprises.

---

## Implementation checklist (quick reference)

| Item                         | Priority | Effort  | Status / note        |
|-----------------------------|----------|---------|----------------------|
| Health check `/api/health`  | High     | Low     | Done                 |
| Security headers            | High     | Low     | Done                 |
| Env validation at startup  | High     | Low     | Done (`lib/env.ts`)  |
| Root + global error boundary| High     | Low     | Done                 |
| API error-handler pattern   | High     | Medium  | Pattern in lib       |
| Zod validation on all APIs | High     | Medium  | Coach only today     |
| Distributed rate limiting   | Medium   | Medium  | Upstash/KV           |
| Structured logging         | Medium   | Medium  | Add logger + use in API |
| Unit tests (safety, rate limit) | Medium | Low  | Not started          |
| Audit logging               | Medium   | Medium  | Not started          |
| CSP (report-only then on)  | Medium   | Medium  | Optional             |
| E2E critical path           | Lower    | High    | Optional             |

Use this doc as a living roadmap: tackle high-priority, low-effort items first, then add validation, logging, and tests, and finally scale and enterprise features.
