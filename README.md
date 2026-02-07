# Reframe

Reframe is a privacy-first CBT-inspired self-coaching web app.

Tagline: **"Reframe — shift your thoughts, gently."**

## Tech Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- shadcn/ui-style component primitives
- Framer Motion
- Dexie + IndexedDB (local-first data storage)
- OpenAI API (server-side route handlers only)

## Local Setup

1. Install dependencies:
   ```bash
   npm i
   ```
2. Create env file:
   ```bash
   cp .env.example .env
   ```
3. Add your OpenAI key in `.env` if you want AI features:
   ```env
   OPENAI_API_KEY=...
   ```
4. Start dev server:
   ```bash
   npm run dev
   ```

## Environment Variables

See `.env.example`:

- `OPENAI_API_KEY`
- `OPENAI_MODEL` (default `gpt-4o-mini`)
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_APP_TAGLINE`
- `RATE_LIMIT_RPM` (default `20`)
- `BOT_PROTECTION_ENABLED` (`true|false`)
- `BOT_PROTECTION_TOKEN` (required if bot protection enabled)

## Privacy Model

- Local-first by default using IndexedDB (Dexie).
- No account required.
- Entries stay on the device by default.
- Server endpoints process transient AI requests only.
- No private journal content is stored on the server by default.

## Safety Behavior

- Disclaimers are shown in onboarding and Settings.
- Reframe is explicitly an educational self-coaching tool, not professional care.
- High-risk detection runs **before** any LLM call.
- If flagged (self-harm/violence risk), normal coaching is blocked and a brief supportive safety response is returned.
- Safety events are logged locally with timestamp + category + source only.

## Local-Only Mode

- In Settings, enable **Local-only mode** to disable all OpenAI calls.
- Journaling, thought records, skills, and insights continue to work fully offline.

## Switching Models

Use Settings -> Privacy & AI -> Advanced model settings:

- model name (default `gpt-4o-mini`)
- temperature
- max tokens (capped at 450)

These settings are stored locally and sent to `/api/coach` for server-side enforcement.

## API Route Details

- Endpoint: `POST /api/coach`
- Runtime: `nodejs` (`app/api/coach/route.ts`)
- Modes: `coach`, `distortions`, `socratic`, `reframe`
- Protections:
  - max request body size (`20KB`)
  - max message count
  - best-effort per-IP rate limiting
  - optional bot protection behind env flag

## Vercel Deployment

1. Push this project to GitHub.
2. Import project in Vercel.
3. Add env vars from `.env.example` in Vercel project settings.
4. Deploy.

Notes:

- `/api/coach` already uses `export const runtime = "nodejs"`.
- App remains local-first on client (Dexie in browser) with no required database service.
