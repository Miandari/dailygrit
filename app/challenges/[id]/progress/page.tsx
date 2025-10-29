import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { ProgressCalendar } from '@/components/progress/ProgressCalendar';
import { StreakDisplay } from '@/components/progress/StreakDisplay';
import { ParticipantsLeaderboard } from '@/components/progress/ParticipantsLeaderboard';
import { ParticipantProgressCard } from '@/components/progress/ParticipantProgressCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

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
    .select('*')
    .eq('id', id)
    .single();

  if (challengeError || !challenge) {
    notFound();
  }

  // Check if user is participant
  const { data: myParticipation } = await supabase
    .from('challenge_participants')
    .select('id, current_streak, longest_streak, status')
    .eq('challenge_id', id)
    .eq('user_id', user.id)
    .single();

  if (!myParticipation) {
    notFound();
  }

  // Fetch my entries
  const { data: myEntries } = await supabase
    .from('daily_entries')
    .select('entry_date, is_completed')
    .eq('participant_id', myParticipation.id)
    .order('entry_date', { ascending: true });

  // Calculate my statistics
  const myCompletedDays = myEntries?.filter(e => e.is_completed).length || 0;
  const totalDays = Math.ceil(
    (new Date().getTime() - new Date(challenge.starts_at).getTime()) /
    (1000 * 60 * 60 * 24)
  );
  const maxDays = Math.min(totalDays, challenge.duration_days);

  // Fetch all participants with their profiles
  const { data: allParticipants } = await supabase
    .from('challenge_participants')
    .select(`
      id,
      user_id,
      current_streak,
      longest_streak,
      total_points,
      status,
      profiles:user_id (
        username,
        avatar_url
      )
    `)
    .eq('challenge_id', id)
    .eq('status', 'active');

  // Fetch all entries for all participants
  const participantIds = allParticipants?.map(p => p.id) || [];
  const { data: allEntries } = await supabase
    .from('daily_entries')
    .select('participant_id, entry_date, is_completed, metric_data, notes')
    .in('participant_id', participantIds)
    .order('entry_date', { ascending: true });

  // Group entries by participant
  const entriesByParticipant = allEntries?.reduce((acc, entry) => {
    if (!acc[entry.participant_id]) {
      acc[entry.participant_id] = [];
    }
    acc[entry.participant_id].push(entry);
    return acc;
  }, {} as Record<string, any[]>) || {};

  // Calculate stats for each participant
  const participantsWithStats = allParticipants?.map(participant => {
    const entries = entriesByParticipant[participant.id] || [];
    const completedDays = entries.filter(e => e.is_completed).length;
    const lastActivity = entries.length > 0
      ? entries[entries.length - 1].entry_date
      : null;

    return {
      ...participant,
      profile: Array.isArray(participant.profiles)
        ? participant.profiles[0]
        : participant.profiles,
      completedDays,
      totalDays: maxDays,
      lastActivity,
      entries,
    };
  }) || [];

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

          <h1 className="text-3xl font-bold text-gray-900">Challenge Progress</h1>
          <p className="mt-2 text-gray-600">{challenge.name}</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="your-progress" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="your-progress">Your Progress</TabsTrigger>
            <TabsTrigger value="all-participants">All Participants</TabsTrigger>
          </TabsList>

          {/* Your Progress Tab */}
          <TabsContent value="your-progress" className="space-y-8">
            {/* Streak Display */}
            <StreakDisplay
              currentStreak={myParticipation.current_streak || 0}
              longestStreak={myParticipation.longest_streak || 0}
              totalDays={maxDays}
              completedDays={myCompletedDays}
            />

            {/* Calendar View */}
            <ProgressCalendar
              entries={myEntries || []}
              challengeStartDate={new Date(challenge.starts_at)}
              challengeEndDate={new Date(challenge.ends_at)}
            />

            {/* Additional Stats */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="text-lg font-semibold mb-4">Challenge Timeline</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Started</span>
                    <span className="font-medium">
                      {format(new Date(challenge.starts_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ends</span>
                    <span className="font-medium">
                      {format(new Date(challenge.ends_at), 'MMM d, yyyy')}
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
                      {Math.floor((myParticipation.longest_streak || 0) / 7)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Missed Days</span>
                    <span className="font-medium">
                      {maxDays - myCompletedDays}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className="font-medium capitalize">
                      {myParticipation.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* All Participants Tab */}
          <TabsContent value="all-participants" className="space-y-8">
            {/* Leaderboard */}
            <ParticipantsLeaderboard
              participants={participantsWithStats}
              currentUserId={user.id}
            />

            {/* Individual Progress Cards */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Individual Progress</h2>
              <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                {participantsWithStats.map(participant => (
                  <ParticipantProgressCard
                    key={participant.id}
                    participant={participant}
                    entries={participant.entries}
                    challengeStartDate={new Date(challenge.starts_at)}
                    challengeEndDate={new Date(challenge.ends_at)}
                    isCurrentUser={participant.user_id === user.id}
                    completedDays={participant.completedDays}
                    totalDays={participant.totalDays}
                  />
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
