# DailyGrit - Daily Challenge Tracker

A web application for creating, joining, and tracking daily challenges with custom metrics. Built with Next.js, Supabase, and TypeScript.

## Features

- ✅ User authentication (email/password + Google OAuth)
- 📊 Custom challenge creation with flexible metrics
- 🎯 Daily progress tracking
- 📈 Streak counting and progress visualization
- 👥 Social features (join challenges, view participant progress)
- 🔒 Privacy settings (public or invite-only challenges)
- 📧 Email notifications (planned)
- 📥 Data export (planned)

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
   cd dailygrit
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
dailygrit/
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

## Key Features Implementation Status

### Completed ✅
- [x] Next.js project setup with TypeScript and Tailwind CSS
- [x] Supabase integration (client & server)
- [x] Authentication system (email/password + Google OAuth)
- [x] Database schema and migrations
- [x] Row Level Security policies
- [x] Basic dashboard layout
- [x] Navigation and routing
- [x] shadcn/ui component library integration

### Recently Completed ✅
- [x] Challenge creation wizard with metric builder
- [x] Challenge discovery and joining flows (public & private)
- [x] Daily entry form with all metric types (boolean, number, duration, choice, text, file)
- [x] Progress visualization (calendar view, streak tracking, statistics)
- [x] File upload system with image optimization
- [x] Delete and leave challenge functionality
- [x] Progress dashboard with calendar and stats

### Planned 📋
- [ ] Leaderboards and rankings
- [ ] Email notifications
- [ ] Data export functionality
- [ ] Enhanced mobile optimization
- [ ] Dark mode
- [ ] Advanced search and filters
- [ ] Social features (comments, reactions)

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

**⭐ If you find this project helpful, please give it a star!**
