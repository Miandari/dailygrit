import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { ProgressCalendar } from '@/components/progress/ProgressCalendar';
import { StreakDisplay } from '@/components/progress/StreakDisplay';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function ProgressPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch challenge details
  const { data: challenge, error: challengeError } = await supabase
    .from('challenges')
    .select(`
      *,
      challenge_participants!inner (
        id,
        user_id,
        current_streak,
        longest_streak,
        status
      )
    `)
    .eq('id', id)
    .eq('challenge_participants.user_id', user.id)
    .single();

  if (challengeError || !challenge) {
    notFound();
  }

  const participant = challenge.challenge_participants[0];

  // Fetch all entries for this participant
  const { data: entries } = await supabase
    .from('daily_entries')
    .select('entry_date, is_completed')
    .eq('participant_id', participant.id)
    .order('entry_date', { ascending: true });

  // Calculate statistics
  const completedDays = entries?.filter(e => e.is_completed).length || 0;
  const totalDays = Math.ceil(
    (new Date().getTime() - new Date(challenge.starts_at).getTime()) /
    (1000 * 60 * 60 * 24)
  );
  const maxDays = Math.min(totalDays, challenge.duration_days);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4">
            <Link href={`/challenges/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Challenge
            </Link>
          </Button>

          <h1 className="text-3xl font-bold text-gray-900">Your Progress</h1>
          <p className="mt-2 text-gray-600">{challenge.name}</p>
        </div>

        {/* Streak Display */}
        <div className="mb-8">
          <StreakDisplay
            currentStreak={participant.current_streak || 0}
            longestStreak={participant.longest_streak || 0}
            totalDays={maxDays}
            completedDays={completedDays}
          />
        </div>

        {/* Calendar View */}
        <ProgressCalendar
          entries={entries || []}
          challengeStartDate={new Date(challenge.starts_at)}
          challengeEndDate={new Date(challenge.ends_at)}
        />

        {/* Additional Stats */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-semibold mb-4">Challenge Timeline</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Started</span>
                <span className="font-medium">
                  {new Date(challenge.starts_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ends</span>
                <span className="font-medium">
                  {new Date(challenge.ends_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Days Remaining</span>
                <span className="font-medium">
                  {Math.max(0, challenge.duration_days - maxDays)}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Perfect Weeks</span>
                <span className="font-medium">
                  {Math.floor(participant.longest_streak / 7)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Missed Days</span>
                <span className="font-medium">
                  {maxDays - completedDays}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="font-medium capitalize">
                  {participant.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}