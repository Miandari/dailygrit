# DailyGrit - Claude Notes & Pinned Issues

## Code Style Guidelines

**NO EMOJIS**: Do not use emojis anywhere in the codebase, file content, UI/UX, or commit messages unless explicitly necessary. Keep all text professional and emoji-free.

## Pinned Issues

### 1. Supabase Schema Cache Issue - Foreign Key Relationship
**Status**: Workaround implemented, needs investigation

**Problem**:
Supabase PostgREST is not detecting the foreign key relationship between `challenge_participants.user_id` and `profiles.id`, even though the foreign key exists in the migration file.

**Current Workaround**:
- Fetching participants and profiles in separate queries
- Joining data in application code using Map
- Location: `/app/challenges/[id]/progress/page.tsx` (lines 67-91)

**Proper Fix Needed**:
1. Verify foreign key exists in production database by running:
```sql
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'challenge_participants'
  AND tc.constraint_type = 'FOREIGN KEY';
```

2. If foreign key is missing, create it:
```sql
ALTER TABLE challenge_participants
ADD CONSTRAINT challenge_participants_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;
```

3. Refresh Supabase schema cache (done automatically after schema changes, or restart PostgREST)

**Expected Behavior**:
Should be able to use:
```javascript
.select(`
  id,
  user_id,
  profiles (
    username,
    avatar_url
  )
`)
```

---

## Recent Features Implemented

### Points-Based Scoring System
- [DONE] Configurable points per metric
- [DONE] Threshold-based scoring (binary, scaled, tiered modes)
- [DONE] Minimum/Maximum threshold selection
- [DONE] Bonus points for streaks and perfect days
- [DONE] Edit challenge settings page
- [DONE] Recalculate historical points
- [DONE] Points display on progress page
- [DONE] Leaderboard with points

### Key Files:
- `/lib/utils/scoring.ts` - Scoring calculation logic
- `/components/challenges/EditChallengeForm.tsx` - Settings editor
- `/app/actions/updateChallenge.ts` - Save settings action
- `/app/actions/recalculatePoints.ts` - Recalculate all points
- `/app/challenges/[id]/progress/page.tsx` - Progress & leaderboard

---

## Pending Work

### App Redesign - Match Landing Page Style
- [ ] **Add Dark/Light Theme Toggle System**
  - Implement theme provider (next-themes or custom context)
  - Add theme toggle component to navigation
  - Persist theme preference in localStorage

- [ ] **Update Color Scheme**
  - Primary background: `#0A0A0B`
  - Secondary background: `#0F1419`
  - Accent color: `#00FF88`
  - Card background: `#151515`
  - Card borders: `#2A2A2A`
  - Primary text: `#FFFFFF`
  - Secondary text: `#9CA3AF`

- [ ] **Apply Dark Gradient Backgrounds**
  - Use `linear-gradient(to bottom, #0A0A0B 0%, #0F1419 100%)` throughout app
  - Add subtle radial green glow (`rgba(0, 255, 136, 0.15)`) where appropriate

- [ ] **Update Button Styles**
  - Primary: Green accent (`#00FF88`) with dark text (`#0A0A0B`)
  - Secondary: White (`#FFFFFF`) with dark text
  - Add hover scale animations (`hover:scale-105`)

- [ ] **Update Icons and Components**
  - Ensure all icons from lucide-react match landing page style
  - Update icon colors to match theme

- [ ] **Update Card Components**
  - Background: `#151515`
  - Borders: `#2A2A2A` (1px)
  - Border radius: rounded-2xl
  - Apply consistent padding

- [ ] **Apply Inter Font Family**
  - Set `fontFamily: 'Inter, system-ui, -apple-system, sans-serif'` globally
  - Update all custom styled components

- [ ] **Update Navigation Bar**
  - Match landing page dark aesthetic
  - Use new color scheme
  - Add theme toggle button

- [ ] **Test Theme Switching**
  - Test all pages with dark theme
  - Test all pages with light theme (if implemented)
  - Ensure no style conflicts or broken components

### Reminder System
- [ ] **Implement Daily Reminder Notifications**
  - Set up notification service (Web Push API or external service)
  - Create backend endpoints for scheduling reminders
  - Handle notification permissions

- [ ] **Add Reminder Settings Page**
  - Time selection for daily reminders
  - Notification preferences (email, push, SMS)
  - Per-challenge reminder customization
  - Snooze options

### UX Improvements
- [ ] **Interactive Daily Metrics Cards** - Make metrics clickable on challenge detail page for quick logging
  - Need to handle challenges with many metrics (pagination or scrolling)
  - Show recent values/activity for each metric
  - Consider modal or inline quick-log functionality
  - Location: `/app/challenges/[id]/page.tsx`

### Database Migrations
- [ ] Run `supabase/temp_add_threshold_type.sql` to add threshold_type to existing metrics
- [ ] Investigate and fix foreign key schema cache issue

---

## Architecture Notes

### RLS (Row Level Security) Pattern
Uses `user_challenge_access` table to break circular dependencies:
- Triggers maintain access automatically when users join/create challenges
- All RLS policies check this table instead of nested queries
- Location: `/supabase/migrations/20250127000002_row_level_security.sql`

### Scoring System
Three modes:
1. **Binary**: Full points if threshold met, zero otherwise
2. **Scaled**: Proportional points based on progress toward threshold
3. **Tiered**: Different point values for different achievement levels

Supports both minimum (at least X) and maximum (at most X) thresholds.

---

## Development Notes

### Common Commands
```bash
# Run dev server
npm run dev

# Run migrations locally
supabase db reset

# Generate types
supabase gen types typescript --local > lib/supabase/database.types.ts

# Push to production
git add . && git commit && git push
```

### Environment Variables Needed
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for admin operations)

---

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS + shadcn/ui
- **Language**: TypeScript

---

*Last updated: 2025-01-28*
