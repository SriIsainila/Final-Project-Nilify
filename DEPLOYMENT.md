# Free deployment without a payment card

Nilify deploys as one Vercel Services project backed by a Neon Free PostgreSQL
database. The Vite frontend is mounted at `/` and FastAPI is mounted at `/api`,
so browser API calls and authentication cookies stay on the same origin.

## 1. Create the Neon database

Create a free Neon project and copy its **pooled** connection string. Keep the
password private. Nilify converts Neon's standard PostgreSQL URL and SSL query
parameters for its async database driver automatically.

## 2. Import the repository into Vercel

Import the GitHub repository and configure:

- Project Name: `nilify`
- Application Preset: `Services`
- Root Directory: repository root (leave it as `./`)

The root `vercel.json` defines both services and their routing. Do not select
`frontend` or `backend` as the project Root Directory.

## 3. Add environment variables

Before deploying, add these values for Production, Preview, and Development:

```text
NILIFY_DATABASE_URL=<the private Neon pooled connection string>
NILIFY_JWT_SECRET=<a random secret of at least 32 characters>
CRON_SECRET=<a different random secret of at least 16 characters>
NILIFY_APP_ENV=production
NILIFY_DEBUG=false
NILIFY_SCHEDULER_ENABLED=false
NILIFY_AUTH_COOKIE_SECURE=true
NILIFY_AUTH_COOKIE_SAMESITE=lax
```

No `VITE_API_BASE_URL` is needed. The frontend already calls `/api` on the same
deployment. The FastAPI build runs `alembic upgrade head` to create/update the
Neon schema.

## 4. Deploy and verify

Deploy, then open these URLs:

```text
https://YOUR-PROJECT.vercel.app/
https://YOUR-PROJECT.vercel.app/health
https://YOUR-PROJECT.vercel.app/api/cron/track
```

The cron URL should return `401 Unauthorized` in a browser. That is expected:
Vercel invokes it with `Authorization: Bearer <CRON_SECRET>` once per day.

Test registration, login, adding a product, logout, and a direct refresh on
`/dashboard`.

## Free-plan limitations

- Vercel Hobby cron runs at most once per day, so automatic price checks are daily.
- Neon Free has usage and storage limits but no 30-day database expiry.
- SMTP and optional Gemini/PayHere features need separate provider credentials.
