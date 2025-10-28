import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import DailyEntryForm from '@/components/daily-entry/DailyEntryForm';

export default async function TodayPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user's active participations with challenge details
  const { data: myParticipations } = await supabase
    .from('challenge_participants')
    .select(`
      *,
      challenges (*)
    `)
    .eq('user_id', user.id)
    .eq('status', 'active');

  const activeChallenges: any[] = [];
  const todayEntries: any = {};
  const todayDate = format(new Date(), 'yyyy-MM-dd');
  const todayFormatted = format(new Date(), 'EEEE, MMMM d, yyyy');

  if (myParticipations) {
    for (const participation of myParticipations) {
      const challenge = participation.challenges;
      if (challenge) {
        // Check if challenge is currently active (between start and end dates)
        const now = new Date();
        const startDate = new Date(challenge.starts_at);
        const endDate = new Date(challenge.ends_at);

        if (now >= startDate && now <= endDate) {
          activeChallenges.push({
            ...challenge,
            participation_id: participation.id,
            current_streak: participation.current_streak,
            longest_streak: participation.longest_streak,
          });

          // Get today's entry if it exists
          const { data: entry } = await supabase
            .from('daily_entries')
            .select('*')
            .eq('participant_id', participation.id)
            .eq('entry_date', todayDate)
            .single();

          if (entry) {
            todayEntries[participation.id] = entry;
          }
        }
      }
    }
  }

  if (activeChallenges.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Today&apos;s Tasks</h1>
          <p className="mt-2 text-gray-600">{todayFormatted}</p>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Challenges</h3>
            <p className="text-gray-600 mb-4">
              You don&apos;t have any active challenges to track today.
            </p>
            <div className="flex gap-2 justify-center">
              <Button asChild>
                <Link href="/challenges/browse">Browse Challenges</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/challenges/create">Create a Challenge</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Today&apos;s Tasks</h1>
        <p className="mt-2 text-gray-600">{todayFormatted}</p>
      </div>

      {/* Summary */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Challenges</CardDescription>
            <CardTitle className="text-2xl">{activeChallenges.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Completed Today</CardDescription>
            <CardTitle className="text-2xl">
              {Object.keys(todayEntries).length}/{activeChallenges.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Current Streaks</CardDescription>
            <CardTitle className="text-2xl">
              {activeChallenges.reduce((sum, c) => sum + c.current_streak, 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Challenge entries */}
      <div className="space-y-6">
        {activeChallenges.map((challenge) => {
          const entry = todayEntries[challenge.participation_id];
          const isCompleted = entry?.is_completed;
          const isLocked = entry?.is_locked;
          const daysElapsed = Math.floor(
            (new Date().getTime() - new Date(challenge.starts_at).getTime()) /
              (1000 * 60 * 60 * 24)
          );

          return (
            <Card key={challenge.id} className={isCompleted ? 'border-green-500' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{challenge.name}</CardTitle>
                    <CardDescription className="mt-1">
                      Day {daysElapsed + 1} of {challenge.duration_days}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">🔥 {challenge.current_streak} day streak</Badge>
                    {isCompleted && (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Completed
                      </Badge>
                    )}
                    {isLocked && (
                      <Badge variant="secondary">
                        Locked
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isCompleted && isLocked ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      You&apos;ve completed today&apos;s entry and it&apos;s now locked. Great job!
                    </AlertDescription>
                  </Alert>
                ) : (
                  <DailyEntryForm
                    challenge={challenge}
                    participationId={challenge.participation_id}
                    existingEntry={entry}
                    isLocked={isLocked}
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}