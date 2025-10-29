import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressCalendar } from './ProgressCalendar';
import { TrendingUp, Calendar, Target } from 'lucide-react';

interface ParticipantEntry {
  entry_date: string;
  is_completed: boolean;
}

interface ParticipantProgressCardProps {
  participant: {
    id: string;
    user_id: string;
    current_streak: number;
    longest_streak: number;
    profile: {
      username: string;
      avatar_url: string | null;
    };
  };
  entries: ParticipantEntry[];
  challengeStartDate: Date;
  challengeEndDate: Date;
  isCurrentUser: boolean;
  completedDays: number;
  totalDays: number;
}

export function ParticipantProgressCard({
  participant,
  entries,
  challengeStartDate,
  challengeEndDate,
  isCurrentUser,
  completedDays,
  totalDays,
}: ParticipantProgressCardProps) {
  const completionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {participant.profile.username || 'Unknown User'}
              {isCurrentUser && (
                <Badge variant="secondary" className="text-xs">
                  You
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span>{participant.current_streak} day streak</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span>Best: {participant.longest_streak} days</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">{completionRate}%</div>
            <div className="text-xs text-gray-500">
              {completedDays}/{totalDays} days
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ProgressCalendar
          entries={entries}
          challengeStartDate={challengeStartDate}
          challengeEndDate={challengeEndDate}
        />
      </CardContent>
    </Card>
  );
}
