# Quick Setup & Testing Guide

## Step 1: Create Supabase Project (5 minutes)

1. **Go to Supabase Dashboard**
   - Visit https://supabase.com/dashboard
   - Click "New Project"

2. **Fill in project details:**
   - **Name**: `dailygrit` (or whatever you prefer)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose the closest to you
   - Click "Create new project"

3. **Wait for project to initialize** (~2 minutes)

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Project Settings** (gear icon)
2. Click **API** in the left sidebar
3. You'll see these values - copy them:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)
   - **service_role key** (another long string, keep this secret!)

## Step 3: Configure Environment Variables

1. **Create the .env.local file:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Edit .env.local** and paste your values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

## Step 4: Run Database Migrations

### Option A: Using Supabase Dashboard (Easiest)

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **New query**
3. Open `supabase/migrations/20250127000001_initial_schema.sql` in your code editor
4. **Copy all the content** and paste into the SQL Editor
5. Click **Run** (bottom right)
6. You should see "Success. No rows returned" ✅

7. Repeat for the second migration:
   - Open `supabase/migrations/20250127000002_rls_policies.sql`
   - Copy all content
   - Paste into a new query in SQL Editor
   - Click **Run**

### Option B: Using Supabase CLI (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Link your project (you'll need your project ref from dashboard)
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

## Step 5: Enable Google OAuth (Optional but recommended)

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Google** and click to expand
3. Toggle **Enable Sign in with Google**
4. You'll need to create OAuth credentials:

   **Create Google OAuth App:**
   - Go to https://console.cloud.google.com/
   - Create a new project or select existing
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - Choose **Web application**
   - Add authorized redirect URIs:
     - `http://localhost:3000/auth/callback` (for local testing)
     - `https://your-project-id.supabase.co/auth/v1/callback` (from Supabase)
   - Copy **Client ID** and **Client Secret**
   - Paste them into Supabase Google provider settings
   - Click **Save**

   **Note:** You can skip this for now and test with email/password first!

## Step 6: Verify Database Setup

Run this query in SQL Editor to check all tables were created:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see:
- ✅ challenge_participants
- ✅ challenges
- ✅ daily_entries
- ✅ notification_preferences
- ✅ profiles
- ✅ user_storage_usage

## Step 7: Configure Auth Settings

1. Go to **Authentication** → **URL Configuration**
2. Add your Site URL: `http://localhost:3000`
3. Add Redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/**` (wildcard for development)

## Step 8: Start the Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Step 9: Test Authentication Flow

### Test 1: Landing Page
- ✅ You should see the DailyGrit landing page
- ✅ "Get Started" and "Log In" buttons should be visible

### Test 2: Sign Up
1. Click **Get Started** or navigate to http://localhost:3000/signup
2. Fill in:
   - **Username**: testuser
   - **Email**: test@example.com
   - **Password**: password123
3. Click **Sign Up**
4. You should be redirected to `/dashboard`
5. Check your email for verification (Supabase sends one)

### Test 3: Verify User in Database
Go to Supabase dashboard → **Authentication** → **Users**
- You should see your test user listed

Go to **Table Editor** → **profiles**
- You should see a profile row for your user

### Test 4: Dashboard
- ✅ You should see "Welcome back, testuser!"
- ✅ Navigation bar shows Dashboard, Today, Browse, Create
- ✅ Your avatar/username in top right
- ✅ "Active Challenges" section (empty for now)

### Test 5: Navigation
- Click on your profile icon (top right)
- Dropdown should show:
  - Your username/email
  - Profile
  - Settings
  - Log out

### Test 6: Logout and Login
1. Click **Log out** from dropdown
2. You should be redirected to the landing page
3. Click **Log In**
4. Enter your credentials
5. You should be back in the dashboard

### Test 7: Google OAuth (if configured)
1. Click **Sign Up** or **Log In**
2. Click the Google button
3. Follow Google auth flow
4. Should redirect back to dashboard

## Troubleshooting

### Issue: "Invalid API key"
**Solution:** Double-check your `.env.local` file. Make sure:
- No extra spaces around the `=` sign
- Keys are complete (they're very long)
- File is named exactly `.env.local`

### Issue: "relation 'profiles' does not exist"
**Solution:** Migrations didn't run. Go back to Step 4 and run migrations.

### Issue: "Failed to fetch"
**Solution:**
- Check if dev server is running (`npm run dev`)
- Verify Supabase project is active (check dashboard)
- Check browser console for errors (F12)

### Issue: Can't sign up - no error message
**Solution:**
- Check browser console (F12) for errors
- Verify URL Configuration in Supabase (Step 7)
- Check RLS policies were created (run second migration)

### Issue: "Email not confirmed"
**Solution:**
- Go to Supabase dashboard → **Authentication** → **Users**
- Find your user and click the **...** menu
- Click "Send verification email" OR manually confirm the user

### Issue: Pages are unstyled
**Solution:**
- Stop dev server (Ctrl+C)
- Run `npm install` again
- Start dev server `npm run dev`
- Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)

## Quick Verification Checklist

Before moving to next features, verify:

- [ ] ✅ Landing page loads
- [ ] ✅ Can sign up with email/password
- [ ] ✅ User appears in Supabase Auth dashboard
- [ ] ✅ Profile automatically created in profiles table
- [ ] ✅ Dashboard loads after login
- [ ] ✅ Can logout
- [ ] ✅ Can login again
- [ ] ✅ Navigation works (all links accessible)
- [ ] ✅ No console errors (check browser DevTools)

## Next Steps

Once everything is working:
1. ✅ You have a working authentication system
2. ✅ Database is set up with proper security
3. ✅ Ready to build challenge features!

You can now proceed with:
- Building the challenge creation wizard
- Adding challenge discovery/browse page
- Creating the daily entry form

## Development Tips

**Browser DevTools (F12):**
- **Console tab**: Check for JavaScript errors
- **Network tab**: See API requests to Supabase
- **Application tab**: View localStorage and cookies

**Useful Commands:**
```bash
npm run dev          # Start dev server
npm run build        # Test production build
npm run type-check   # Check TypeScript errors
npm run lint         # Check code quality
```

**Testing Different Users:**
- Use different email addresses for testing
- Or use email+tag trick: `yourname+test1@gmail.com`, `yourname+test2@gmail.com`
- These go to same inbox but Supabase treats them as different users

Happy building! 🚀
