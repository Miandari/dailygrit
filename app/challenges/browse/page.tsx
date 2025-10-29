import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { format } from 'date-fns';
import { Search, Lock } from 'lucide-react';
import RequestToJoinButton from '@/components/challenges/RequestToJoinButton';

export default async function BrowseChallengesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch all challenges (public and private)
  let query = supabase
    .from('challenges')
    .select('*')
    .order('created_at', { ascending: false });

  // Add search filter if provided
  if (params?.search) {
    query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`);
  }

  const { data: challenges } = await query;

  // Fetch creator profiles separately
  const creatorIds = challenges?.map(c => c.creator_id) || [];
  const { data: creators } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', creatorIds);

  const creatorMap = new Map(creators?.map(c => [c.id, c]) || []);

  // Get participant counts and join request status for each challenge
  const challengesWithCounts = await Promise.all(
    (challenges || []).map(async (challenge) => {
      // Count participants
      const { count } = await supabase
        .from('challenge_participants')
        .select('*', { count: 'exact', head: true })
        .eq('challenge_id', challenge.id)
        .eq('status', 'active');

      // Check if current user is participating
      let isParticipating = false;
      let hasRequestedToJoin = false;
      let requestStatus = null;

      if (user) {
        const { data: participation } = await supabase
          .from('challenge_participants')
          .select('id')
          .eq('challenge_id', challenge.id)
          .eq('user_id', user.id)
          .single();

        isParticipating = !!participation;

        // Check for existing join request if not participating
        if (!isParticipating && !challenge.is_public) {
          const { data: joinRequest } = await supabase
            .from('challenge_join_requests')
            .select('status')
            .eq('challenge_id', challenge.id)
            .eq('user_id', user.id)
            .single();

          if (joinRequest) {
            hasRequestedToJoin = true;
            requestStatus = joinRequest.status;
          }
        }
      }

      return {
        ...challenge,
        creator: creatorMap.get(challenge.creator_id),
        participantCount: count || 0,
        isParticipating,
        hasRequestedToJoin,
        requestStatus,
      };
    })
  );

  const getChallengeStatus = (challenge: any) => {
    const now = new Date();
    const startDate = new Date(challenge.starts_at);
    const endDate = new Date(challenge.ends_at);

    if (now < startDate) {
      return { label: 'Upcoming', variant: 'secondary' as const };
    } else if (now > endDate) {
      return { label: 'Completed', variant: 'outline' as const };
    } else {
      return { label: 'Active', variant: 'default' as const };
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Browse Challenges</h1>
        <p className="mt-2 text-gray-600">
          Discover public and private challenges
        </p>

        {/* Search bar */}
        <form className="mt-6 flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              name="search"
              placeholder="Search challenges..."
              defaultValue={params?.search}
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>
      </div>

      {challenges && challenges.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">No public challenges found</p>
            <Button asChild className="mt-4">
              <Link href="/challenges/create">Create the First Challenge</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {challengesWithCounts.map((challenge: any) => {
          const status = getChallengeStatus(challenge);
          const daysElapsed = Math.floor(
            (new Date().getTime() - new Date(challenge.starts_at).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          const progress = Math.min(100, Math.max(0, (daysElapsed / challenge.duration_days) * 100));

          return (
            <Link key={challenge.id} href={`/challenges/${challenge.id}`}>
              <Card className="h-full transition-shadow hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="line-clamp-1">{challenge.name}</CardTitle>
                    <Badge variant={status.variant} className="ml-2">
                      {status.label}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {challenge.description || 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Created by</span>
                      <span className="font-medium">
                        {challenge.creator?.username || 'Unknown'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Duration</span>
                      <span className="font-medium">{challenge.duration_days} days</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Participants</span>
                      <span className="font-medium">{challenge.participantCount}</span>
                    </div>

                    {status.label === 'Active' && (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium">
                            Day {Math.min(daysElapsed + 1, challenge.duration_days)} of{' '}
                            {challenge.duration_days}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full bg-blue-600 transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </>
                    )}

                    {status.label === 'Upcoming' && (
                      <div className="text-sm">
                        <span className="text-gray-600">Starts: </span>
                        <span className="font-medium">
                          {format(new Date(challenge.starts_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      {!challenge.is_public && (
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          Private
                        </Badge>
                      )}
                      {(challenge.metrics as any[])?.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {(challenge.metrics as any[]).length} metrics
                        </Badge>
                      )}
                      {challenge.isParticipating && (
                        <Badge variant="default" className="text-xs">
                          Participating
                        </Badge>
                      )}
                      {challenge.hasRequestedToJoin && challenge.requestStatus === 'pending' && (
                        <Badge variant="secondary" className="text-xs">
                          Request Pending
                        </Badge>
                      )}
                      {challenge.requestStatus === 'rejected' && (
                        <Badge variant="destructive" className="text-xs">
                          Request Rejected
                        </Badge>
                      )}
                    </div>

                    {/* Request to Join button for private challenges */}
                    {!challenge.is_public && !challenge.isParticipating && !challenge.hasRequestedToJoin && user && (
                      <div className="mt-3">
                        <RequestToJoinButton
                          challengeId={challenge.id}
                          challengeName={challenge.name}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}