import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Link from 'next/link';
import { Settings } from 'lucide-react';
import DeleteChallengeButton from '@/components/challenges/DeleteChallengeButton';
import LeaveChallengeButton from '@/components/challenges/LeaveChallengeButton';
import CopyInviteCodeButton from '@/components/challenges/CopyInviteCodeButton';

export default async function ChallengePage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch challenge details directly (RLS will handle access control)
  const { data: challenge, error: challengeError } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', id)
    .single();

  if (challengeError || !challenge) {
    console.error('Challenge fetch error:', challengeError);
    notFound();
  }

  // Check if current user is participant (separate query due to RLS)
  let isParticipant = false;
  let participantCount = 0;

  if (user) {
    const { data: myParticipation } = await supabase
      .from('challenge_participants')
      .select('id')
      .eq('challenge_id', id)
      .eq('user_id', user.id)
      .single();

    isParticipant = !!myParticipation;
  }

  // Get participant count (only if public or creator)
  // For now, we'll estimate based on whether it's public
  if (challenge.is_public || challenge.creator_id === user?.id) {
    // Creator can see actual count, others see estimate for public challenges
    participantCount = 1; // At least the creator
  }

  const isCreator = challenge.creator_id === user?.id;

  // Get creator profile separately
  const { data: creatorProfile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', challenge.creator_id)
    .single();

  const getFailureModeLabel = (mode: string) => {
    const labels = {
      strict: 'Strict - Reset on miss',
      flexible: 'Flexible - Continue with gaps',
      grace: 'Grace Period',
    };
    return labels[mode as keyof typeof labels] || mode;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{challenge.name}</h1>
              {challenge.description && (
                <p className="mt-2 text-gray-600">{challenge.description}</p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge variant={challenge.is_public ? 'default' : 'secondary'}>
                  {challenge.is_public ? 'Public' : 'Private'}
                </Badge>
                <Badge variant="outline">{challenge.duration_days} days</Badge>
                {isCreator && <Badge variant="secondary">You created this</Badge>}
                {isParticipant && !isCreator && <Badge variant="secondary">Participating</Badge>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              {!isParticipant && user && challenge.is_public && (
                <Button asChild>
                  <Link href={`/challenges/${id}/join`}>Join Challenge</Link>
                </Button>
              )}
              {!isParticipant && user && !challenge.is_public && !isCreator && (
                <div className="text-sm text-gray-600 py-2">
                  This is a private challenge. Request to join from the Browse page.
                </div>
              )}
              {isParticipant && (
                <>
                  <Button asChild>
                    <Link href="/dashboard/today">Go to Today&apos;s Tasks</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href={`/challenges/${id}/entries`}>View All Days</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href={`/challenges/${id}/progress`}>View Progress</Link>
                  </Button>
                  {!isCreator && (
                    <LeaveChallengeButton
                      challengeId={challenge.id}
                      challengeName={challenge.name}
                    />
                  )}
                </>
              )}
              {isCreator && (
                <>
                  <Button asChild variant="outline">
                    <Link href={`/challenges/${id}/participants`}>
                      Manage Participants
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href={`/challenges/${id}/edit`}>
                      <Settings className="mr-2 h-4 w-4" />
                      Edit Settings
                    </Link>
                  </Button>
                  <DeleteChallengeButton
                    challengeId={challenge.id}
                    challengeName={challenge.name}
                  />
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Challenge Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-600">Created by:</span>
                <p>{creatorProfile?.username || 'Unknown'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Start Date:</span>
                <p>{format(new Date(challenge.starts_at), 'MMMM d, yyyy')}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">End Date:</span>
                <p>{format(new Date(challenge.ends_at), 'MMMM d, yyyy')}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Failure Mode:</span>
                <p>{getFailureModeLabel(challenge.failure_mode)}</p>
              </div>
              {challenge.lock_entries_after_day && (
                <Badge variant="outline">Entries lock after submission</Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daily Metrics ({(challenge.metrics as any[])?.length || 0})</CardTitle>
              <CardDescription>What you&apos;ll track each day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(challenge.metrics as any[])?.map((metric: any, index: number) => (
                  <div key={metric.id} className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{index + 1}.</span>
                    <span className="font-medium">{metric.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {metric.type}
                    </Badge>
                    {metric.required && (
                      <Badge variant="outline" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {!challenge.is_public && challenge.invite_code && isCreator && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Invite Code</CardTitle>
              <CardDescription>Share this code with people you want to join</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <code className="rounded bg-gray-100 px-4 py-2 text-xl font-mono">
                  {challenge.invite_code}
                </code>
                <CopyInviteCodeButton inviteCode={challenge.invite_code} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}