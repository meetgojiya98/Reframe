# Deploy Reframe on Vercel (with accounts)

## Quick start: host on Vercel

1. **Push your code** to GitHub (e.g. `meetgojiya98/Reframe`).
2. Go to **[vercel.com](https://vercel.com)** → **Add New** → **Project**.
3. **Import** your GitHub repo `Reframe`. Leave build settings as default (Next.js is auto-detected).
4. **Environment variables**: before deploying, add at least:
   - `POSTGRES_URL` — your Supabase/Neon/Postgres connection string.
   - `NEXTAUTH_SECRET` — run `openssl rand -base64 32` and paste the result.
   - `NEXTAUTH_URL` — leave empty on first deploy; Vercel will use the deployment URL. After first deploy, set it to `https://<your-project>.vercel.app` (or use **Settings → Domains** to see the URL).
   - `OPENAI_API_KEY` — (optional) for Coach and AI features.
5. Click **Deploy**. After the first deploy, set `NEXTAUTH_URL` to your live URL and redeploy if needed.
6. **Database schema**: run `npm run db:push` once locally with `POSTGRES_URL` pointing to your production DB (or use the same URL from Vercel env) so tables exist.

---

## 1. Database

Create a Postgres database:

- **Vercel**: Project → Storage → Create Database → Postgres (or use Neon from the Integrations marketplace).
- **Neon / Supabase / Railway**: Create a project and copy the connection string.

Set the connection URL in Vercel:

- **Vercel Postgres**: `POSTGRES_URL` is set automatically when you link the storage.
- **Other**: Add `POSTGRES_URL` or `DATABASE_URL` in Project → Settings → Environment Variables.

## 2. Push the schema

Locally (with `POSTGRES_URL` or `DATABASE_URL` in `.env`):

```bash
npm run db:push
```

Or run the same after cloning and setting env vars in Vercel (e.g. via a one-off script or Vercel’s run command).

## 3. Environment variables (Vercel)

In the Vercel project, set:

| Variable           | Description |
|--------------------|-------------|
| `POSTGRES_URL`     | Postgres connection URL (or use `DATABASE_URL`) |
| `NEXTAUTH_SECRET`  | Random secret, e.g. `openssl rand -base64 32` |
| `NEXTAUTH_URL`     | Production URL, e.g. `https://your-app.vercel.app` |
| `OPENAI_API_KEY`   | Optional; for AI Coach |

Vercel sets `VERCEL_URL`; you can set `NEXTAUTH_URL` to `https://$VERCEL_URL` if you use the default Vercel URL.

## 4. Deploy

Push to your Git repo; Vercel will build and deploy. After the first deploy, run `npm run db:push` once (with the production DB URL) if you haven’t already applied the schema to that database.

## 5. Users

- **Sign up**: `/signup` — creates a user and profile in Postgres.
- **Sign in**: `/login` — session is JWT (no DB session store).
- App routes (`/today`, `/coach`, etc.) require a signed-in user; otherwise redirect to `/login`.
