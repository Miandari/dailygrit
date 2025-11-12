# DailyGrit Database Migrations

This directory contains SQL migration files for setting up the DailyGrit database schema.

## TL;DR

**New project?** Run `supabase db reset` and you're done.

**Existing database created before Jan 30, 2025?** Your `profiles` table is missing columns. See [Missing Columns](#missing-columns) for a copy-paste SQL fix.

**Existing database created after Jan 30, 2025?** Just run `supabase migration up` to apply new migrations.

---

## Table of Contents

- [Quick Start](#quick-start)
  - [New Projects](#new-projects-fresh-setup)
  - [Existing Databases](#existing-databases)
- [Migration Order](#migration-order)
- [Profile Table Schema Reference](#profile-table-schema-reference)
- [Troubleshooting](#troubleshooting)
  - [Schema Cache Issues](#schema-cache-issues)
  - [Missing Columns](#missing-columns) ⭐ **Common issue fix**
  - [Foreign Key Issues](#foreign-key-issues)
- [Development Workflow](#development-workflow)
- [Production Deployment](#production-deployment)
- [Migration History](#migration-history--schema-evolution)

---

## Quick Start

### New Projects (Fresh Setup)

If you're setting up DailyGrit from scratch:

```bash
# Clone the repository
git clone <repo-url>
cd dailygrit

# Start Supabase and apply all migrations
supabase start
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > lib/supabase/database.types.ts
```

The initial schema creates everything you need, including:
- Complete profiles table with basic info, social links, and activity tracking
- Challenges, participants, and daily entries tables with points system
- User preferences table for notifications and settings
- Indexes, triggers, and RLS (Row Level Security) policies

### Existing Databases

#### Option 1: Your database was created recently (recommended)
If you created your database after January 30, 2025, simply apply any new migrations:

```bash
supabase migration up
```

#### Option 2: Your database is older and missing profile columns
If you have an older database created before the profile fields update, check which columns exist:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND table_schema = 'public'
ORDER BY ordinal_position;
```

If you're missing columns like `bio`, `website_url`, `twitter_handle`, etc., see the **[Missing Columns](#missing-columns)** troubleshooting section below.

## Migration Order

Migrations are applied in chronological order based on their timestamp prefix:

1. `20250127000001_initial_schema.sql` - Core database schema (includes all profile fields)
2. `20250127000002_row_level_security.sql` - RLS policies
3. `20250127000003_storage_setup.sql` - File storage configuration
4. `20250128000003_join_requests_and_notifications.sql` - Join requests feature
5. `20250128000006_creator_add_participant_function.sql` - Helper functions
6. `20250128000007_fix_participants_select_rls.sql` - RLS fixes
7. `20250128000008_fix_access_table_and_backfill.sql` - Access table updates
8. `20250128000009_fix_entry_dates_timezone.sql` - Timezone fixes
9. `20250129000001_public_participant_counts.sql` - Participant counts
10. `20250129000001_user_preferences.sql` - User preferences table

## Profile Table Schema Reference

### Complete Schema (Current)

After running all migrations, the `profiles` table should have these columns:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, REFERENCES auth.users(id) | User ID from Supabase Auth |
| `username` | TEXT | UNIQUE | User's unique username |
| `full_name` | TEXT | - | User's full name |
| `avatar_url` | TEXT | - | URL to profile picture |
| `bio` | TEXT | - | User biography/about me |
| `website_url` | TEXT | - | Personal website URL |
| `twitter_handle` | TEXT | - | Twitter/X username (without @) |
| `github_handle` | TEXT | - | GitHub username |
| `instagram_handle` | TEXT | - | Instagram username (without @) |
| `location` | TEXT | - | User location (e.g., "San Francisco, CA") |
| `public_profile_url` | TEXT | UNIQUE, CHECK format | Custom URL slug (lowercase, alphanumeric + hyphens) |
| `last_active_at` | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | Auto-updated on profile changes |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | When profile was created |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | Auto-updated on profile changes |

### Database Age Quick Reference

| When Database Was Created | What You Have | What To Do |
|---------------------------|---------------|------------|
| **After Jan 30, 2025** | ✅ All 14 columns | Nothing - you're all set! |
| **Before Jan 30, 2025** | ⚠️ Missing social fields | Run SQL from [Missing Columns](#missing-columns) section |
| **Brand New (today)** | ✅ All 14 columns | Just run `supabase db reset` |

## Troubleshooting

### Schema Cache Issues

If you get errors like "Could not find column X in schema cache", refresh the PostgREST cache:

```sql
NOTIFY pgrst, 'reload schema';
```

Or restart PostgREST in your Supabase dashboard: **Project Settings → Database → Restart PostgREST**

### Missing Columns

**When this happens:** If you cloned this repository and have an existing database created before January 30, 2025, your `profiles` table may be missing newer columns.

**Check which columns exist:**

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND table_schema = 'public'
ORDER BY ordinal_position;
```

**Expected columns:** `id`, `username`, `full_name`, `avatar_url`, `bio`, `website_url`, `twitter_handle`, `github_handle`, `instagram_handle`, `location`, `public_profile_url`, `last_active_at`, `created_at`, `updated_at`

**If columns are missing, run this SQL in your Supabase SQL Editor:**

```sql
-- Add missing basic profile columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add social media and location columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_handle TEXT,
ADD COLUMN IF NOT EXISTS github_handle TEXT,
ADD COLUMN IF NOT EXISTS instagram_handle TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS public_profile_url TEXT,
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'profiles_public_profile_url_key'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_public_profile_url_key UNIQUE (public_profile_url);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'public_profile_url_format'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT public_profile_url_format
        CHECK (public_profile_url ~ '^[a-z0-9-]+$' OR public_profile_url IS NULL);
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_public_profile_url ON public.profiles(public_profile_url);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active_at ON public.profiles(last_active_at DESC);

-- Update trigger function
CREATE OR REPLACE FUNCTION public.update_profile_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    NEW.last_active_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_profile_timestamps();

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
```

**After running this:**
1. Verify columns exist with the query above
2. Restart PostgREST if schema cache issues persist
3. Try updating your profile in the app

### Foreign Key Issues

If you encounter foreign key relationship issues (see CLAUDE.md Pinned Issue #1), you may need to:

1. Verify the foreign key exists
2. Refresh the schema cache
3. Check RLS policies

## Development Workflow

### Local Development

```bash
# Start Supabase locally
supabase start

# Reset database (destroys data)
supabase db reset

# Apply new migrations only
supabase migration up

# Generate TypeScript types
supabase gen types typescript --local > lib/supabase/database.types.ts
```

### Creating New Migrations

```bash
# Create a new migration file
supabase migration new your_migration_name

# Edit the generated file in supabase/migrations/
# Then apply it
supabase migration up
```

## Production Deployment

When deploying to production:

1. **Never use `supabase db reset`** - this destroys all data
2. Use `supabase db push` or `supabase migration up` instead
3. Always test migrations on staging first
4. Back up your database before applying migrations

## Migration History & Schema Evolution

### January 30, 2025 - Profile Fields Consolidation

**What changed:** The initial schema migration (`20250127000001_initial_schema.sql`) was updated to include all profile fields from the start, including social links, location, and activity tracking.

**Why this matters:**
- **Fresh databases** (created after this date) automatically have all profile columns
- **Existing databases** (created before this date) may need to manually add missing columns
- This eliminated the need for separate patch migrations

**If you're upgrading:** Use the SQL script in the [Missing Columns](#missing-columns) section to add any fields your database is missing.

### Previous Approach (Before Jan 30, 2025)

Originally, the initial schema only included basic profile fields (`id`, `username`, `avatar_url`, `created_at`). Social profile fields were added later via separate migrations, which created:
- Complexity for new setups
- Potential for schema drift between databases
- Need for multiple migration files

The current approach is simpler: one complete initial schema that includes everything.

## Important Notes

- **All migrations use `IF NOT EXISTS`** checks to be idempotent and safe to run multiple times
- **The profiles table has automatic triggers** that update `updated_at` and `last_active_at` on every profile change
- **RLS (Row Level Security) policies** ensure users can only view all profiles but modify only their own
- **The `public_profile_url` has validation:**
  - Must be unique across all users
  - Only lowercase letters, numbers, and hyphens allowed
  - CHECK constraint enforces the format: `^[a-z0-9-]+$`
- **Schema cache refresh** may be needed after manual column additions (see troubleshooting)

## Need Help?

- **Schema issues?** See the [Troubleshooting](#troubleshooting) section
- **Missing columns?** See [Missing Columns](#missing-columns) with complete SQL fix
- **Migration questions?** Check `CLAUDE.md` for known issues and workarounds
- **RLS problems?** See [Foreign Key Issues](#foreign-key-issues) for debugging tips
