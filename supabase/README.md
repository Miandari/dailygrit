# Supabase Setup Instructions

## Prerequisites
- Supabase account (https://supabase.com)
- Supabase CLI installed (`npm install -g supabase`)

## Setup Steps

### 1. Create a new Supabase project
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in project details:
   - Name: dailygrit
   - Database Password: (choose a strong password)
   - Region: (choose closest to your users)

### 2. Get your project credentials
1. Go to Project Settings > API
2. Copy these values to your `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

### 3. Run database migrations

The project includes 3 clean migrations that must be run in order:

1. **20250127000001_initial_schema.sql** - Creates all tables and indexes
2. **20250127000002_row_level_security.sql** - Sets up RLS policies and access control
3. **20250127000003_storage_setup.sql** - Configures file storage

#### Option A: Using Supabase Dashboard (Recommended)
1. Go to SQL Editor in your Supabase dashboard
2. Open `migrations/20250127000001_initial_schema.sql`
3. Copy and paste the entire content into the SQL Editor
4. Click "Run"
5. Repeat for the remaining 2 migrations in order

#### Option B: Using Supabase CLI
```bash
# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### 4. Configure Google OAuth (Optional but recommended)

1. Go to Authentication > Providers in Supabase dashboard
2. Enable Google provider
3. Follow the instructions to set up Google OAuth:
   - Create OAuth credentials in Google Cloud Console
   - Add authorized redirect URIs
   - Copy Client ID and Client Secret to Supabase

### 5. Configure Storage

The migration automatically creates the `challenge-uploads` bucket with:
- Public access for viewing
- 5MB max file size per upload
- Allowed types: JPEG, PNG, GIF, WebP

Optional: Adjust storage limits
1. Go to Storage in your Supabase dashboard
2. Select the `challenge-uploads` bucket
3. Adjust file size limits if needed

### 6. Set up Email Templates (Optional for MVP)

1. Go to Authentication > Email Templates
2. Customize the email templates for:
   - Confirm signup
   - Magic Link
   - Invite user
   - Reset password

### 7. Verify Setup

Run this query in SQL Editor to verify all tables were created:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see:
- challenges
- challenge_participants
- daily_entries
- profiles
- user_challenge_access

## Local Development with Supabase CLI

For local development, you can use Supabase locally:

```bash
# Start Supabase locally
supabase start

# Stop Supabase
supabase stop

# Reset database
supabase db reset
```

## Generating TypeScript Types

After running migrations, generate TypeScript types:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/database.types.ts
```

## Troubleshooting

### Migration Errors
- Make sure you run migrations in order (001 before 002)
- Check for any syntax errors in the SQL
- Verify your database connection

### RLS Policy Issues
- RLS must be enabled on all tables
- Test policies by creating test users
- Check policy conditions match your use case

### Storage Issues
- Verify the bucket was created
- Check RLS policies on storage.objects
- Ensure file paths follow the pattern: `user_id/challenge_id/file_name`
