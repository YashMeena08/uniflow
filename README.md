# Student OS (Batches 1-5)
Next.js 15 + TypeScript + Tailwind + Supabase.

## Run it
1. Install Node.js 20+.
2. Create a free project at supabase.com.
3. Supabase > SQL Editor: paste ALL of `supabase/ALL_IN_ONE.sql`, click Run (once).
4. Supabase > Project Settings > API: copy the Project URL and the anon public key.
5. Copy `.env.example` to `.env.local` and fill in both values.
6. Supabase > Authentication > Providers > Email: turn OFF "Confirm email" for development.
7. Supabase > Authentication > URL Configuration > Redirect URLs: add http://localhost:3000/auth/callback
8. In this folder: `npm install` then `npm run dev`, open http://localhost:3000
9. Register, finish onboarding, then Subjects > "Load demo data".

## Deploy
Push to GitHub, import the repo on vercel.com, add the two env vars, Deploy.
Then set Supabase Site URL + Redirect URL (https://YOUR-APP.vercel.app/auth/callback).
