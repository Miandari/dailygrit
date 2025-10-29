import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import EntriesClient from './EntriesClient';

export const revalidate = 0;

export default async function AllEntriesPage({
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

  // Fetch challenge
  const { data: challenge } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', id)
    .single();

  if (!challenge) {
    notFound();
  }

  // Check if user is participant
  const { data: myParticipation } = await supabase
    .from('challenge_participants')
    .select('id')
    .eq('challenge_id', id)
    .eq('user_id', user.id)
    .single();

  if (!myParticipation) {
    notFound();
  }

  // Fetch all entries for this participant
  const { data: entries } = await supabase
    .from('daily_entries')
    .select('*')
    .eq('participant_id', myParticipation.id)
    .order('entry_date', { ascending: false });

  // Serialize the challenge data for client component
  const serializedChallenge = {
    id: challenge.id,
    name: challenge.name,
    description: challenge.description,
    creator_id: challenge.creator_id,
    starts_at: challenge.starts_at,
    ends_at: challenge.ends_at,
    duration_days: challenge.duration_days,
    is_public: challenge.is_public,
    invite_code: challenge.invite_code,
    failure_mode: challenge.failure_mode,
    lock_entries_after_day: challenge.lock_entries_after_day,
    metrics: challenge.metrics,
    enable_streak_bonus: challenge.enable_streak_bonus,
    streak_bonus_points: challenge.streak_bonus_points,
    enable_perfect_day_bonus: challenge.enable_perfect_day_bonus,
    perfect_day_bonus_points: challenge.perfect_day_bonus_points,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4">
            <Link href={`/challenges/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Challenge
            </Link>
          </Button>

          <h1 className="text-3xl font-bold text-gray-900">All Entries</h1>
          <p className="mt-2 text-gray-600">{challenge.name}</p>
        </div>

        <EntriesClient
          challenge={serializedChallenge}
          participantId={myParticipation.id}
          entries={entries || []}
          challengeStartDate={new Date(challenge.starts_at)}
          challengeEndDate={new Date(challenge.ends_at)}
        />
      </div>
    </div>
  );
}
