# VeytronaTech website

Vercel-ready static website with Node.js Functions, a hosted Postgres contact inbox, and a protected browser-based admin inbox.

## Deploy on Vercel

1. Create a Neon or Supabase Postgres database. For Supabase, use its transaction-pooler connection string for serverless traffic.
2. In Vercel, import this GitHub repository.
3. Add these Vercel environment variables for Production, Preview, and Development:

   - `DATABASE_URL` — your pooled Postgres connection string
   - `SESSION_SECRET` — a long random value
   - `ADMIN_PASSWORD_HASH` — generate it with `npm run hash-password -- "your-long-password"`

4. Deploy. The contact form is at `/contact`; the inbox is at `/admin/login`.

Vercel installs the dependencies from `package.json` and serves the clean routes configured in `vercel.json`.

## Local development

```powershell
npm install
npx vercel dev
```

Copy `.env.example` to `.env.local` and set real values before running locally. Never commit `.env.local`.
