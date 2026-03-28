# SplitEasy 💸

A Splitwise-style expense splitting app built with Next.js + Supabase.

## Deploy to Vercel (free)

1. Push this repo to GitHub
2. Go to https://junk-one-shot-demo-website.vercel.app/dashboard → New Project → import your repo
3. Add these environment variables in Vercel's project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Deploy

## Local dev

```bash
npm install
npm run dev
```

## Features

- Sign up / sign in
- Create groups, invite friends by email
- Add expenses (split equally)
- See who owes what per group
