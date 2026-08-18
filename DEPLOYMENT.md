# Free deployment without a payment card

Nilify uses two Vercel Hobby projects and one Neon Free PostgreSQL project:

- `nilify-api`: FastAPI backend (`backend` root directory)
- `nilify-web`: Vite frontend (`frontend` root directory)
- `nilify`: Neon PostgreSQL database

No secret belongs in Git. Add every value listed below in the provider dashboard.

## 1. Create the Neon database

Create the free Neon project and copy its **pooled** connection string. Keep the
password private. Nilify accepts Neon's standard `postgresql://` connection URL
and converts its SSL parameters for the async database driver automatically.

## 2. Deploy the backend to Vercel

Import the GitHub repository as a new Vercel project and configure:

- Project Name: `nilify-api`
- Framework Preset: `Other`
- Root Directory: `backend`

Add these Production environment variables before deploying:

```text
NILIFY_DATABASE_URL=<the private Neon pooled connection string>
NILIFY_JWT_SECRET=<a random secret of at least 32 characters>
CRON_SECRET=<a different random secret of at least 16 characters>
NILIFY_APP_ENV=production
NILIFY_DEBUG=false
NILIFY_SCHEDULER_ENABLED=false
NILIFY_AUTH_COOKIE_SECURE=true
NILIFY_AUTH_COOKIE_SAMESITE=none
NILIFY_FRONTEND_ORIGINS=https://temporary.invalid
NILIFY_FRONTEND_URL=https://temporary.invalid
```

The build runs `alembic upgrade head`, then Vercel serves `backend/index.py` as
one FastAPI function. The secured `/api/cron/track` route runs once daily on the
Hobby plan. `CRON_SECRET` makes Vercel send the matching bearer token.

After deployment, verify:

```text
https://YOUR-API.vercel.app/health
```

## 3. Deploy the frontend to Vercel

Import the same repository again as a second Vercel project:

- Project Name: `nilify-web`
- Framework Preset: `Vite`
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

Add this Production environment variable:

```text
VITE_API_BASE_URL=https://YOUR-API.vercel.app/api
```

Deploy and copy the final frontend URL. `frontend/vercel.json` preserves React
Router pages during direct visits and refreshes.

## 4. Connect the two deployments

In the `nilify-api` Vercel project, replace both temporary values with the exact
frontend origin (no trailing slash):

```text
NILIFY_FRONTEND_ORIGINS=https://YOUR-WEB.vercel.app
NILIFY_FRONTEND_URL=https://YOUR-WEB.vercel.app
```

Redeploy `nilify-api`, then test registration, login, adding a product, logout,
and a direct browser refresh on `/dashboard`.

## Free-plan limitations

- Vercel Hobby cron runs at most once per day, so automatic price checks are daily.
- Neon Free has usage and storage limits but no 30-day database expiry.
- SMTP and optional Gemini/PayHere features need separate provider credentials.
