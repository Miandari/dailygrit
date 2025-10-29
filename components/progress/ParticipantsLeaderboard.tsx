import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, Calendar } from 'lucide-react';

interface Participant {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  profile: {
    username: string;
    avatar_url: string | null;
  };
  completedDays: number;
  totalDays: number;
  lastActivity: string | null;
}

interface ParticipantsLeaderboardProps {
  participants: Participant[];
  currentUserId: string;
}

export function ParticipantsLeaderboard({ participants, currentUserId }: ParticipantsLeaderboardProps) {
  // Sort by completion rate, then by current streak
  const sortedParticipants = [...participants].sort((a, b) => {
    const completionRateA = a.totalDays > 0 ? a.completedDays / a.totalDays : 0;
    const completionRateB = b.totalDays > 0 ? b.completedDays / b.totalDays : 0;

    if (completionRateB !== completionRateA) {
      return completionRateB - completionRateA;
    }
    return b.current_streak - a.current_streak;
  });

  const getCompletionRate = (participant: Participant) => {
    if (participant.totalDays === 0) return 0;
    return Math.round((participant.completedDays / participant.totalDays) * 100);
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (index === 1) return <Trophy className="h-4 w-4 text-gray-400" />;
    if (index === 2) return <Trophy className="h-4 w-4 text-amber-600" />;
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leaderboard</CardTitle>
        <CardDescription>See how everyone is doing</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedParticipants.map((participant, index) => {
            const isCurrentUser = participant.user_id === currentUserId;
            const completionRate = getCompletionRate(participant);

            return (
              <div
                key={participant.id}
                className={`flex items-center justify-between rounded-lg border p-3 ${
                  isCurrentUser ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center justify-center w-8">
                    {getRankBadge(index) || (
                      <span className="text-sm font-semibold text-gray-500">#{index + 1}</span>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {participant.profile.username || 'Unknown User'}
                      </span>
                      {isCurrentUser && (
                        <Badge variant="secondary" className="text-xs">
                          You
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>{participant.current_streak} day streak</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {participant.completedDays}/{participant.totalDays} days
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{completionRate}%</div>
                  <div className="text-xs text-gray-500">completion</div>
                </div>
              </div>
            );
          })}

          {sortedParticipants.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No participants yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
