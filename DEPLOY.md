# Deploy Reframe on Vercel (with accounts)

## Quick start: host on Vercel

1. **Push your code** to GitHub (e.g. `meetgojiya98/Reframe`).
2. Go to **[vercel.com](https://vercel.com)** → **Add New** → **Project**.
3. **Import** your GitHub repo `Reframe`. Leave build settings as default (Next.js is auto-detected).
4. **Environment variables**: before deploying, add at least:
   - `POSTGRES_URL` — your Supabase/Neon/Postgres connection string.
   - `NEXTAUTH_SECRET` — run `openssl rand -base64 32` and paste the result.
   - `NEXTAUTH_URL` — your app’s full URL, e.g. `https://your-project.vercel.app`. On Vercel this can be set to `https://$VERCEL_URL` so preview and production both work; the app also auto-sets it from `VERCEL_URL` if missing.
   - `OPENAI_API_KEY` — (optional) for Coach and AI features.
5. Click **Deploy**. If auth fails, ensure `NEXTAUTH_URL` is set to your exact live URL (or `https://$VERCEL_URL`) and redeploy.
6. **Database schema**: run `npm run db:push` once locally with `POSTGRES_URL` pointing to your production DB (or use the same URL from Vercel env) so tables exist.

---

## 1. Database

Create a Postgres database:

- **Vercel**: Project → Storage → Create Database → Postgres (or use Neon from the Integrations marketplace).
- **Neon / Supabase / Railway**: Create a project and copy the connection string.

Set the connection URL in Vercel:

- **Vercel Postgres**: `POSTGRES_URL` is set automatically when you link the storage.
- **Supabase on Vercel**: Use the **Connection pooler** URI from Supabase → Settings → Database (Session or Transaction mode, port 6543). The direct DB URL (port 5432) can fail from serverless. Copy the URI and replace `[YOUR-PASSWORD]` with your DB password (use `%24` for `$`).
- **Other**: Add `POSTGRES_URL` or `DATABASE_URL` in Project → Settings → Environment Variables.

## 2. Push the schema (required for sign up / sign in)

**You must apply the schema to the same Postgres database that Vercel uses.** If you see errors like "Failed query" or "relation \"users\" does not exist" when signing up or signing in, the schema is missing.

Locally, with your **production** database URL (copy from Vercel → Settings → Environment Variables → `POSTGRES_URL`):

```bash
POSTGRES_URL="postgresql://user:pass@host:5432/dbname?sslmode=require" npm run db:push
```

Or add `POSTGRES_URL` to your `.env`, then run:

```bash
npm run db:push
```

Use the exact same `POSTGRES_URL` (or `DATABASE_URL`) that you set in Vercel so the tables exist in the DB your app uses.

## 3. Environment variables (Vercel)

In the Vercel project, set:

| Variable           | Description |
|--------------------|-------------|
| `POSTGRES_URL`     | Postgres connection URL (or use `DATABASE_URL`) |
| `NEXTAUTH_SECRET`  | Random secret, e.g. `openssl rand -base64 32` |
| `NEXTAUTH_URL`     | Production URL, e.g. `https://your-app.vercel.app`; or `https://$VERCEL_URL` so preview deployments work |
| `OPENAI_API_KEY`   | Optional; for AI Coach |

Vercel sets `VERCEL_URL`; you can set `NEXTAUTH_URL` to `https://$VERCEL_URL` if you use the default Vercel URL.

## 4. Deploy

Push to your Git repo; Vercel will build and deploy. After the first deploy, run `npm run db:push` once (with the production DB URL) if you haven’t already applied the schema to that database.

## 5. Users

- **Sign up**: `/signup` — creates a user and profile in Postgres.
- **Sign in**: `/login` — session is JWT (no DB session store).
- App routes (`/today`, `/coach`, etc.) require a signed-in user; otherwise redirect to `/login`.

## 6. Troubleshooting

| Symptom | Fix |
|--------|-----|
| "Failed query" or "relation \"users\" does not exist" on sign up / sign in | The production database has no tables. Run `db:push` (see step 2) or use the SQL fallback below. |
| `ENOTFOUND` or "Can't find db.xxx.supabase.co" when running `db:push` | Your network/DNS can't resolve Supabase's direct host. Use the **exact** connection URI from Supabase Dashboard → Settings → Database (Session or Transaction mode); newer projects may use a pooler host. Or apply the schema via SQL Editor (see below). |
| "Invalid email or password" right after sign up | Sign up likely failed (e.g. schema missing). Fix the sign up error first, then sign in. |
| Auth works locally but not on Vercel | Set `NEXTAUTH_URL` to your Vercel URL (e.g. `https://$VERCEL_URL`) and ensure `NEXTAUTH_SECRET` is set. |

### Schema via Supabase SQL Editor (when `db:push` fails locally)

If `npm run db:push` fails with `ENOTFOUND` (e.g. your network can't resolve Supabase's DB host), apply the schema from the Supabase Dashboard:

1. Open your project → **SQL Editor**.
2. Copy the contents of **`scripts/supabase-schema.sql`** from this repo.
3. Paste into the editor and click **Run**.

Then ensure Vercel's `POSTGRES_URL` uses the **exact** connection string from Supabase → Settings → Database (Session mode). That URL is what Vercel uses to reach your DB; if it's different from `db.xxx.supabase.co`, use the one from the dashboard.
