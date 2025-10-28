# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Fixed
- **Workspace Root Warning**: Removed duplicate package-lock.json from parent directory
- **Middleware Deprecation**: Migrated from `middleware.ts` to `proxy.ts` for Next.js 16 compatibility
  - Renamed `middleware()` function to `proxy()`
  - Updated file convention to use `proxy.ts` instead of `middleware.ts`

## [0.1.0] - 2025-01-27

### Added
- Initial project setup with Next.js 16, TypeScript, and Tailwind CSS v4
- Supabase integration for authentication and database
- Database schema with 6 tables (profiles, challenges, challenge_participants, daily_entries, user_storage_usage, notification_preferences)
- Row Level Security policies for all tables
- Authentication system (email/password + Google OAuth)
- User dashboard with navigation
- Landing page
- shadcn/ui component library (17 components)
- React Query for data fetching
- Zustand for state management
- Setup and testing documentation (QUICKSTART.md, SETUP_GUIDE.md)
- Verification script (`npm run verify`)

### Features Completed
- ✅ User registration and login
- ✅ Protected routes with authentication
- ✅ User profile management
- ✅ Dashboard layout and navigation
- ✅ Responsive design

### Features Pending
- ⏳ Challenge creation wizard
- ⏳ Challenge discovery and browsing
- ⏳ Daily entry tracking
- ⏳ Progress visualization
- ⏳ File upload system
- ⏳ Leaderboards
- ⏳ Email notifications
- ⏳ Data export
