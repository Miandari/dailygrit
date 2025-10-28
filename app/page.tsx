import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <main className="max-w-4xl text-center">
        <h1 className="mb-6 text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Daily<span className="text-blue-600">Grit</span>
        </h1>
        <p className="mb-8 text-xl text-gray-600 sm:text-2xl">
          Track your daily challenges, build lasting habits, and stay accountable with friends
        </p>
        <p className="mx-auto mb-12 max-w-2xl text-lg text-gray-500">
          Create custom challenges with any metrics you want to track. Join challenges created by
          others or share your own with invite codes. Perfect for fitness goals, learning
          streaks, or any daily commitment.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="text-lg">
            <Link href="/signup">Get Started</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="text-lg">
            <Link href="/login">Log In</Link>
          </Button>
        </div>

        <div className="mt-20 grid gap-8 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="mb-4 text-4xl">🎯</div>
            <h3 className="mb-2 text-lg font-semibold">Custom Challenges</h3>
            <p className="text-sm text-gray-600">
              Create challenges with any duration and custom metrics that match your goals
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="mb-4 text-4xl">📊</div>
            <h3 className="mb-2 text-lg font-semibold">Track Progress</h3>
            <p className="text-sm text-gray-600">
              Visualize your streaks, completion rates, and improvement over time
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="mb-4 text-4xl">👥</div>
            <h3 className="mb-2 text-lg font-semibold">Stay Accountable</h3>
            <p className="text-sm text-gray-600">
              Share challenges with friends and see each other&apos;s progress
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
