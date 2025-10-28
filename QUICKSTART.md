# 🚀 Quick Start Checklist

Follow these steps in order to test your DailyGrit setup:

## ☐ Step 1: Verify Local Setup (2 minutes)

```bash
npm run verify
```

This checks if your project is properly configured. Fix any errors before continuing.

---

## ☐ Step 2: Create Supabase Project (5 minutes)

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in:
   - Name: `dailygrit`
   - Password: (choose a strong one and save it)
   - Region: (pick closest to you)
4. Wait ~2 minutes for initialization

---

## ☐ Step 3: Get API Keys (1 minute)

1. In Supabase dashboard → **Settings** (gear icon) → **API**
2. Copy these 3 values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJ...` (long string)
   - **service_role key**: `eyJ...` (another long string)

---

## ☐ Step 4: Configure Environment (2 minutes)

```bash
# Create .env.local file
cp .env.local.example .env.local

# Edit .env.local and paste your values
```

Your `.env.local` should look like:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Run verify again to check:
```bash
npm run verify
```

---

## ☐ Step 5: Run Database Migrations (3 minutes)

1. In Supabase dashboard → **SQL Editor**
2. Click **"New query"**
3. Copy content from `supabase/migrations/20250127000001_initial_schema.sql`
4. Paste and click **"Run"**
5. Should see "Success. No rows returned" ✅

6. Repeat for `20250127000002_rls_policies.sql`

**Verify tables were created:**
Run this query in SQL Editor:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;
```

You should see 6 tables:
- challenge_participants
- challenges
- daily_entries
- notification_preferences
- profiles
- user_storage_usage

---

## ☐ Step 6: Configure Auth URLs (1 minute)

In Supabase dashboard → **Authentication** → **URL Configuration**:

Add these URLs:
- **Site URL**: `http://localhost:3000`
- **Redirect URLs**:
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/**`

Click **Save**

---

## ☐ Step 7: Start Development Server (1 minute)

```bash
npm run dev
```

Open http://localhost:3000 - you should see the DailyGrit landing page!

---

## ☐ Step 8: Test Authentication (3 minutes)

### Create an account:
1. Click **"Get Started"**
2. Fill in:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `password123`
3. Click **"Sign Up"**
4. Should redirect to `/dashboard` ✅

### Verify in Supabase:
1. Supabase dashboard → **Authentication** → **Users**
2. You should see your test user
3. Click user → **"Confirm email"** (or check your email)

### Test the app:
- [ ] Dashboard shows "Welcome back, testuser!"
- [ ] Navigation bar visible
- [ ] Profile dropdown works (top right)
- [ ] Can logout
- [ ] Can login again

---

## ☐ Step 9: Optional - Google OAuth (10 minutes)

**Skip this for now** if you want to test quickly!

To enable Google login:
1. Create OAuth app at https://console.cloud.google.com/
2. Get Client ID and Secret
3. Add to Supabase → **Authentication** → **Providers** → **Google**

See `SETUP_GUIDE.md` for detailed instructions.

---

## ✅ Success Checklist

Before building more features, verify:

- [x] `npm run verify` passes
- [x] Landing page loads at http://localhost:3000
- [x] Can sign up with email/password
- [x] Dashboard shows after signup
- [x] User appears in Supabase Auth
- [x] Profile created in profiles table
- [x] Can logout and login
- [x] No errors in browser console (F12)

---

## 🎉 You're Ready!

Your DailyGrit foundation is working!

**What you have:**
- ✅ Working authentication
- ✅ Secure database with RLS
- ✅ User dashboard
- ✅ Clean UI with Tailwind + shadcn

**What's next:**
- Challenge creation wizard
- Browse and join challenges
- Daily entry tracking
- Progress visualization

---

## 🆘 Having Issues?

**Quick fixes:**
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check for errors
npm run type-check
```

**Still stuck?** See `SETUP_GUIDE.md` troubleshooting section or check:
- Browser console (F12)
- Terminal where `npm run dev` is running
- Supabase dashboard logs
