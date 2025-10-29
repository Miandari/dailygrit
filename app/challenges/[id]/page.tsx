import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Link from 'next/link';
import { Settings, MoreVertical, Calendar, BarChart3, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  let myParticipation: any = null;
  let myEntries: any[] = [];
  let myStats = {
    currentStreak: 0,
    longestStreak: 0,
    totalPoints: 0,
    completedDays: 0,
    totalDays: 0,
    completionRate: 0
  };

  if (user) {
    const { data: participation } = await supabase
      .from('challenge_participants')
      .select('id, current_streak, longest_streak, total_points, status')
      .eq('challenge_id', id)
      .eq('user_id', user.id)
      .single();

    myParticipation = participation;
    isParticipant = !!myParticipation;

    // Fetch entries if participant
    if (isParticipant) {
      const { data: entries } = await supabase
        .from('daily_entries')
        .select('entry_date, is_completed, points_earned, bonus_points')
        .eq('participant_id', myParticipation.id)
        .order('entry_date', { ascending: false });

      myEntries = entries || [];

      // Calculate statistics
      const completedDays = myEntries.filter(e => e.is_completed).length;
      const totalDays = Math.ceil(
        (new Date().getTime() - new Date(challenge.starts_at).getTime()) /
        (1000 * 60 * 60 * 24)
      );
      const maxDays = Math.min(Math.max(totalDays, 0), challenge.duration_days);

      myStats = {
        currentStreak: myParticipation.current_streak || 0,
        longestStreak: myParticipation.longest_streak || 0,
        totalPoints: myParticipation.total_points || 0,
        completedDays,
        totalDays: maxDays,
        completionRate: maxDays > 0 ? Math.round((completedDays / maxDays) * 100) : 0
      };
    }
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
            <div className="flex gap-2 justify-end">
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
                  <Button asChild size="default">
                    <Link href="/dashboard/today">Track Today</Link>
                  </Button>
                  <Button asChild variant="outline" size="default">
                    <Link href={`/challenges/${id}/progress`}>Leaderboard</Link>
                  </Button>
                  <Button asChild variant="outline" size="default">
                    <Link href={`/challenges/${id}/entries`}>View All Days</Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {isCreator && (
                        <>
                          <DropdownMenuItem asChild>
                            <Link href={`/challenges/${id}/participants`} className="cursor-pointer">
                              <Users className="mr-2 h-4 w-4" />
                              Manage Participants
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/challenges/${id}/edit`} className="cursor-pointer">
                              <Settings className="mr-2 h-4 w-4" />
                              Edit Settings
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <div className="w-full">
                              <DeleteChallengeButton
                                challengeId={challenge.id}
                                challengeName={challenge.name}
                              />
                            </div>
                          </DropdownMenuItem>
                        </>
                      )}
                      {!isCreator && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <div className="w-full">
                              <LeaveChallengeButton
                                challengeId={challenge.id}
                                challengeName={challenge.name}
                              />
                            </div>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
              {isCreator && !isParticipant && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href={`/challenges/${id}/participants`} className="cursor-pointer">
                        <Users className="mr-2 h-4 w-4" />
                        Manage Participants
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/challenges/${id}/edit`} className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Edit Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <div className="w-full">
                        <DeleteChallengeButton
                          challengeId={challenge.id}
                          challengeName={challenge.name}
                        />
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>

        {/* Progress Stats - Only show for participants */}
        {isParticipant && (
          <div className="mb-8">
            {/* Hero Card - Total Points */}
            <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-6 shadow-lg text-white mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold mb-1 opacity-90">Total Points</h3>
                  <div className="text-4xl font-bold">{myStats.totalPoints}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs opacity-90 mb-1">Current Streak</div>
                  <div className="text-3xl font-bold">{myStats.currentStreak}</div>
                  <div className="text-xs opacity-75">days in a row</div>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-gray-600">Completion</div>
                  <div className="text-2xl font-bold">{myStats.completionRate}%</div>
                  <div className="text-xs text-gray-500">{myStats.completedDays}/{myStats.totalDays} days</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-gray-600">Longest Streak</div>
                  <div className="text-2xl font-bold">{myStats.longestStreak}</div>
                  <div className="text-xs text-gray-500">personal best</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-gray-600">Days Left</div>
                  <div className="text-2xl font-bold">{Math.max(0, challenge.duration_days - myStats.totalDays)}</div>
                  <div className="text-xs text-gray-500">to complete</div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

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