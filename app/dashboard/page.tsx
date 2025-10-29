import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get user's active participations
  const { data: myParticipations } = await supabase
    .from('challenge_participants')
    .select(`
      *,
      challenges (*)
    `)
    .eq('user_id', user.id)
    .eq('status', 'active');

  // Get challenges user created
  const { data: myCreatedChallenges } = await supabase
    .from('challenges')
    .select('*')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false });

  // Separate active challenges (where user is participant) and created-only challenges
  const activeChallenges: any[] = [];
  const createdOnlyChallenges: any[] = [];

  if (myParticipations) {
    for (const participation of myParticipations) {
      if (participation.challenges) {
        activeChallenges.push({
          id: participation.id,
          challenge_id: participation.challenge_id,
          current_streak: participation.current_streak,
          longest_streak: participation.longest_streak,
          challenge: participation.challenges
        });
      }
    }
  }

  if (myCreatedChallenges) {
    for (const challenge of myCreatedChallenges) {
      // Check if user is also participating
      const isParticipating = activeChallenges.some(
        ac => ac.challenge_id === challenge.id
      );
      if (!isParticipating) {
        createdOnlyChallenges.push(challenge);
      }
    }
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {profile?.username || 'there'}!
        </h1>
        <p className="mt-2 text-gray-600">
          {activeChallenges.length > 0
            ? `You have ${activeChallenges.length} active ${
                activeChallenges.length === 1 ? 'challenge' : 'challenges'
              }`
            : 'Start your journey by creating or joining a challenge'}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Button asChild size="lg" className="h-auto flex-col gap-2 py-6">
          <Link href="/dashboard/today">
            <span className="text-2xl">📝</span>
            <span>Today&apos;s Tasks</span>
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="h-auto flex-col gap-2 py-6">
          <Link href="/challenges/create">
            <span className="text-2xl">➕</span>
            <span>Create Challenge</span>
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="h-auto flex-col gap-2 py-6">
          <Link href="/challenges/browse">
            <span className="text-2xl">🔍</span>
            <span>Browse Challenges</span>
          </Link>
        </Button>
      </div>

      {/* Active Challenges */}
      <div>
        <h2 className="mb-4 text-2xl font-semibold text-gray-900">Active Challenges</h2>
        {activeChallenges.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="mb-4 text-gray-600">You&apos;re not participating in any challenges yet</p>
              <div className="flex gap-2">
                <Button asChild>
                  <Link href="/challenges/create">Create a Challenge</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/challenges/browse">Browse Challenges</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeChallenges.map((participation: any) => {
              const challenge = participation.challenge;
              if (!challenge) return null;

              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const startDate = new Date(challenge.starts_at);
              startDate.setHours(0, 0, 0, 0);

              const daysElapsed = Math.max(0, Math.floor(
                (today.getTime() - startDate.getTime()) /
                  (1000 * 60 * 60 * 24)
              ));
              const progress = Math.min(100, (daysElapsed / challenge.duration_days) * 100);

              return (
                <Link key={participation.id} href={`/challenges/${challenge.id}`}>
                  <Card className="transition-shadow hover:shadow-lg">
                    <CardHeader>
                      <CardTitle className="line-clamp-1">{challenge.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {challenge.description || 'No description'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium">
                            {daysElapsed === 0 && today < startDate ? (
                              'Not started'
                            ) : (
                              <>
                                Day {Math.min(daysElapsed + 1, challenge.duration_days)} of{' '}
                                {challenge.duration_days}
                              </>
                            )}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full bg-blue-600 transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">
                            🔥 {participation.current_streak} day streak
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {(challenge.metrics as any[])?.length || 0} metrics
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Created Challenges (if any that user is not participating in) */}
      {createdOnlyChallenges.length > 0 && (
        <div>
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">Challenges You Created</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {createdOnlyChallenges.map((challenge: any) => (
              <Link key={challenge.id} href={`/challenges/${challenge.id}`}>
                <Card className="transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{challenge.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {challenge.description || 'No description'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <Badge variant={challenge.is_public ? 'default' : 'secondary'}>
                        {challenge.is_public ? 'Public' : 'Private'}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {challenge.duration_days} days
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}