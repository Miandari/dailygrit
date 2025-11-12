import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, TrendingUp, Target, Award } from 'lucide-react';

interface QuickStatsWidgetProps {
  totalPoints: number;
  longestStreak: number;
  activeStreaksCount: number;
  totalChallenges: number;
}

export function QuickStatsWidget({
  totalPoints,
  longestStreak,
  activeStreaksCount,
  totalChallenges
}: QuickStatsWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Trophy className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Points</div>
              <div className="text-xl font-bold">{totalPoints.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <TrendingUp className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Longest Streak</div>
              <div className="text-xl font-bold">{longestStreak} days</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <Award className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Active Streaks</div>
              <div className="text-xl font-bold">{activeStreaksCount} / {totalChallenges}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <Target className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Active Challenges</div>
              <div className="text-xl font-bold">{totalChallenges}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
