# Deploy Checkpoint to Vercel (manual)

This guide assumes you deploy yourself. The repo is configured for PostgreSQL on Vercel; SQLite is not used in production builds.

## 1. Create a Neon database

1. Sign in at [neon.tech](https://neon.tech) and create a project.
2. Name the database **checkpoint** or **widget** (either is fine).
3. Copy the **connection string** (use the pooled URL if Neon offers it).
4. Ensure the string includes `sslmode=require` (append `?sslmode=require` if missing).

## 2. Link the GitHub repository

1. In [Vercel](https://vercel.com), import **github.com/yuan05-afk/flyrank-capstone-checkpoint**.
2. Confirm **Framework Preset**: Next.js.
3. Confirm **Install Command**: `pnpm install` (from `vercel.json`).
4. Confirm **Build Command**: `pnpm prisma generate && pnpm next build`.

## 3. Import environment variables

1. Open **Project Settings > Environment Variables**.
2. Use **Bulk Import** and paste the contents of `env.vercel.import` from this repo.
3. Replace placeholders:
   - `DATABASE_URL` with your Neon connection string.
   - `CORS_ALLOWLIST` with real customer origins (comma-separated).
   - `RESEND_*` and `NOTIFY_TO` if you want live email (optional for demo).
4. Scope variables to **Production** (and Preview if you want preview deploys to work the same way).

Leave `NEXT_PUBLIC_APP_URL` as a placeholder for the first deploy, or skip it until step 5.

## 4. First deploy

1. Deploy from the Vercel dashboard (or push to the default branch if auto-deploy is on).
2. Wait for the build to finish. Prisma generates the client during build; schema is applied in step 6.

## 5. Set the public app URL

1. Copy your production URL, e.g. `https://flyrank-capstone-checkpoint.vercel.app`.
2. In Vercel env vars, set `NEXT_PUBLIC_APP_URL` to that URL (no trailing slash).
3. Redeploy so embed snippets and links use the correct host.

## 6. Push schema and seed (one time)

Run from your machine with the **same** `DATABASE_URL` as Production (Neon dashboard or Vercel env copy):

```bash
# POSIX
DATABASE_URL="postgresql://..." pnpm db:push
DATABASE_URL="postgresql://..." pnpm db:seed

# PowerShell
$env:DATABASE_URL = "postgresql://..."
pnpm db:push
pnpm db:seed
```

The seed creates demo tenants, API keys, and a widget id. Use the printed API key to sign in on your Vercel URL.

## 7. Verify

1. Open `NEXT_PUBLIC_APP_URL` and sign in with `tenant_a_key_demo_001`.
2. If you embed on another origin, add that origin to `CORS_ALLOWLIST` and redeploy.
3. Submit a test lead; confirm the row appears in the dashboard.

## Notes

- **Rate limiting** uses an in-memory token bucket. For this Capstone demo that is acceptable across Vercel cold starts (limits reset per instance). Swap to Redis behind the same interface for strict production limits.
- **Local development** can use the same Neon database or Docker Postgres; copy `.env.example` to `.env` and set `DATABASE_URL` accordingly.
- Do not commit `.env` or paste production secrets into the repo.
