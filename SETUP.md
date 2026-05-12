# KHU Mail — Setup Guide

Everything below uses free tiers only.

---

## 1. Push to GitHub (5 min)

```bash
bash scripts/push-github.sh <your-github-token>
```

Get a token at: https://github.com/settings/tokens/new?scopes=repo

---

## 2. Create Supabase project (5 min)

1. Go to https://supabase.com → New project (free tier)
2. Note your **Project URL** and **anon public key** (Settings → API)
3. Run both migrations in the SQL editor (in order):
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_gmail_tokens_unique_user.sql`
4. Enable Google provider: Authentication → Providers → Google

---

## 3. Google Cloud Console — OAuth client (10 min)

1. https://console.cloud.google.com → New project → Enable **Gmail API**
2. OAuth consent screen → External → add scope `gmail.readonly`, `gmail.send`
3. Add test user: `kunow159@gmail.com`
4. Credentials → Create OAuth 2.0 Client ID (Web application)
   - Authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`
5. Copy **Client ID** and **Client Secret** → paste into Supabase → Auth → Google provider

---

## 4. Deploy to Vercel (3 min)

```bash
npx vercel --prod
```

- Log in with GitHub when prompted (free hobby plan)
- Set these environment variables in the Vercel dashboard:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_APP_URL=https://<your-vercel-url>.vercel.app
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
```

> `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` must match the credentials you pasted into
> Supabase Auth → Google provider. They are used **server-side** to refresh Google access
> tokens so API routes can call the Gmail API without exposing tokens to the browser.

---

## 5. Local development

```bash
cp .env.local.example .env.local
# Fill in the values from steps 2–4 (Supabase URL, anon key, Google client ID/secret)
npm run dev
# → http://localhost:3000 → sign in with Google
```

---

## Architecture

See the full architecture document on the Paperclip issue: KHU-3 → document: architecture
