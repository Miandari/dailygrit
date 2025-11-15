# Gritful - Daily Challenge Tracker

A web application for tracking habits and challenges through daily check-ins and metrics. Built as a full-stack application demonstrating modern web development practices with Next.js, TypeScript, and Supabase.

## What This Project Does

Gritful is a habit tracking application that helps users maintain consistency in their personal goals. Users can create challenges with custom metrics, log daily progress, and view their completion history through calendars and streak counters.

The application demonstrates several key technical implementations:
- Flexible metric system supporting multiple data types
- Row-level security for multi-tenant data isolation
- Real-time file uploads with image optimization
- Complex database relationships with proper normalization
- Server-side rendering and server actions in Next.js

## Why Use This Application

**For End Users:**
- Track any type of goal with customizable metrics (workouts, reading, meditation, etc.)
- See progress through visual calendars and streak tracking
- Share challenges with friends or keep them private
- Upload photos to document progress

**For Developers:**
- Reference implementation of Next.js 15 with App Router
- Example of Supabase integration with proper RLS policies
- Pattern for handling complex form validation and multi-step workflows
- Demonstration of file upload with optimization
- Implementation of authentication and authorization

## Problem Being Solved

Many people struggle to maintain consistency when working toward personal goals. Generic todo lists lack the structure and motivation needed for habit formation. This application provides:

1. Structured tracking through defined challenges and metrics
2. Visual feedback through streaks and calendars
3. Accountability through shared challenges
4. Flexibility to track any type of measurable goal

### What Makes Gritful Different

Unlike simple habit trackers, Gritful offers:

**Flexible Metric System**: Define exactly what success looks like for your challenge. Track binary yes/no completions, specific numbers (steps, minutes, calories), time durations, multiple choice selections, written reflections, or visual progress through photo uploads.

**Accountability Through Sharing**: Create public challenges that others can join, or use private invite codes for accountability groups. See your progress alongside others working toward similar goals.

**Visual Progress Tracking**: Calendar views show your consistency at a glance, with completed days, missed days, and upcoming entries clearly marked. Streak counters provide immediate feedback on your momentum.

**Smart Data Management**: All entries are securely stored with row-level security. Your data remains private unless you explicitly choose to share challenges publicly. Export capabilities allow you to own your progress data.

### Core Use Cases

- **Fitness Goals**: Track workouts, nutrition, sleep, or weight with customizable metrics
- **Learning & Development**: Monitor study time, practice sessions, or skill-building activities
- **Wellness Habits**: Log meditation, journaling, hydration, or mental health check-ins
- **Creative Projects**: Track daily writing, art creation, or music practice
- **Productivity**: Monitor deep work sessions, task completion, or time management
- **Social Accountability**: Join existing challenges or create group challenges for teams

### Technical Implementation

Built with Next.js, Supabase, and TypeScript.

## Features

### Authentication & User Management
- Secure user authentication with email/password
- OAuth integration with Google (configurable)
- User profile management with avatars and bio
- Password reset and account recovery

### Challenge Creation & Management
- Multi-step challenge creation wizard
- Six metric types: boolean, number, duration, choice, text, and file upload
- Configurable validation rules (min/max values, required fields, character limits)
- Public challenges discoverable by all users
- Private challenges with shareable invite codes
- Challenge editing and deletion capabilities
- Automatic creator participation

### Daily Progress Tracking
- Dynamic form generation based on challenge metrics
- Support for all metric types with appropriate input controls
- Photo uploads with automatic image optimization
- Entry locking to prevent retrospective editing (optional)
- Notes field for additional context on each entry
- Validation of required fields before submission

### Progress Visualization
- Calendar view showing daily completion status
- Visual indicators for completed, missed, and upcoming days
- Current streak counter with milestone achievements
- Longest streak tracking for personal bests
- Completion rate statistics
- Progress timeline showing days remaining

### Social Features
- Browse public challenges
- Search and filter challenges
- Join challenges with one click
- View participant counts
- Leave challenges at any time
- Private challenge sharing via invite codes

### Data Security
- Row-level security on all database operations
- User data isolation
- Secure file storage with access controls
- Input validation and sanitization
- Protected API routes

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **State Management**: Zustand, TanStack Query
- **Forms**: React Hook Form with Zod validation
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- A Supabase account (https://supabase.com)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd gritful
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**

   Follow the instructions in `/supabase/README.md`:
   - Create a new Supabase project
   - Run the migrations from `/supabase/migrations/`
   - Get your project credentials

4. **Configure environment variables**

   Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

   Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
gritful/
├── app/                      # Next.js App Router pages
│   ├── (auth)/              # Auth pages (login, signup)
│   ├── dashboard/           # Dashboard and user pages
│   ├── challenges/          # Challenge pages
│   ├── actions/             # Server actions
│   └── layout.tsx           # Root layout
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   ├── auth/                # Auth-related components
│   ├── challenges/          # Challenge components
│   ├── tracking/            # Progress tracking components
│   └── layout/              # Layout components
├── lib/                     # Utility libraries
│   ├── supabase/            # Supabase client configuration
│   ├── hooks/               # Custom React hooks
│   ├── stores/              # Zustand stores
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Utility functions
├── supabase/                # Supabase configuration
│   ├── migrations/          # Database migrations
│   └── functions/           # Edge functions
└── public/                  # Static assets
```

## Development Workflow

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run format       # Format code with Prettier
npm run type-check   # Run TypeScript type checking
```

### Code Style

This project uses:
- ESLint for code linting
- Prettier for code formatting (with Tailwind CSS plugin)
- TypeScript for type safety

Run `npm run format` before committing to ensure consistent code style.

## Database Schema

The application uses the following main tables:

- `profiles` - User profiles extending Supabase auth.users
- `challenges` - Challenge definitions with metrics
- `challenge_participants` - Users participating in challenges
- `daily_entries` - Daily tracking entries
- `user_storage_usage` - File upload quota tracking
- `notification_preferences` - User notification settings

See `/supabase/migrations/` for the complete schema.

## Implementation Status

### Core Features (Completed)
- Next.js 15 project setup with TypeScript and Tailwind CSS
- Supabase integration for backend services
- Authentication system with email/password and OAuth
- PostgreSQL database schema with comprehensive migrations
- Row Level Security policies for data protection
- Responsive dashboard layout and navigation
- shadcn/ui component library integration
- Challenge creation wizard with metric builder
- Public and private challenge discovery
- Complete daily entry system supporting all metric types
- Calendar-based progress visualization
- Streak tracking and statistics
- File upload with automatic image optimization
- Challenge management (delete, leave)
- Dedicated progress dashboard for each challenge

### Planned Enhancements
- Leaderboards and participant rankings
- Email notification system for reminders and milestones
- Data export functionality (CSV, JSON)
- Enhanced mobile responsive design
- Dark mode theme support
- Advanced search with filters and sorting
- Social interaction features (comments, reactions, encouragement)
- Challenge templates for quick setup
- Detailed analytics and insights
- Gamification elements (badges, achievements)

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

Vercel will automatically:
- Build the Next.js application
- Set up serverless functions
- Configure custom domain (if provided)

### Database Migrations

Run migrations on your production Supabase instance using the Supabase dashboard SQL editor or CLI.

## Troubleshooting

### Common Issues

**Authentication not working**
- Verify environment variables are set correctly
- Check Supabase project settings for allowed redirect URLs
- Ensure OAuth providers are configured in Supabase dashboard

**Database errors**
- Verify migrations have been run in correct order
- Check RLS policies are enabled
- Ensure service role key is set for server-side operations

**Build errors**
- Run `npm run type-check` to identify TypeScript errors
- Clear `.next` directory and rebuild
- Verify all dependencies are installed

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [Supabase](https://supabase.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)

---

**If you find this project helpful, please consider giving it a star on GitHub.**
