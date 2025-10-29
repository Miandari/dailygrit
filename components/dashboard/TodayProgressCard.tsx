'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface TodayProgressCardProps {
  activeChallenges: any[];
  todayEntries: any[];
}

export function TodayProgressCard({ activeChallenges, todayEntries }: TodayProgressCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const completedCount = todayEntries.filter(e => e.is_completed).length;
  const totalCount = activeChallenges.length;
  const allCompleted = completedCount === totalCount && totalCount > 0;
  const noneCompleted = completedCount === 0;

  const incompleteChallenges = activeChallenges.filter(challenge => {
    const entry = todayEntries.find(e => e.participant_id === challenge.id);
    return !entry?.is_completed;
  });

  if (totalCount === 0) {
    return null;
  }

  return (
    <Card className={allCompleted ? 'border-green-500 bg-green-50' : noneCompleted ? 'border-amber-500 bg-amber-50' : 'border-blue-500'}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {allCompleted ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>All Done for Today!</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <span>Today's Progress</span>
                </>
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              {allCompleted
                ? 'Great work! You have completed all challenges for today.'
                : `${completedCount} of ${totalCount} ${totalCount === 1 ? 'challenge' : 'challenges'} completed`
              }
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={allCompleted ? 'default' : 'secondary'} className="text-lg px-3 py-1">
              {completedCount}/{totalCount}
            </Badge>
            {!allCompleted && incompleteChallenges.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-auto py-1"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Hide
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Show Tasks
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && incompleteChallenges.length > 0 && (
        <CardContent>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Pending Challenges:</h4>
            {incompleteChallenges.map(challenge => (
              <div
                key={challenge.id}
                className="flex items-center justify-between p-3 rounded-lg bg-white border"
              >
                <div className="flex-1">
                  <div className="font-medium">{challenge.challenge.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {(challenge.challenge.metrics as any[])?.length || 0} metrics to track
                  </div>
                </div>
                <Button asChild size="sm">
                  <Link href="/dashboard/today">Track Now</Link>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      )}

      {allCompleted && (
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Button asChild variant="outline">
              <Link href="/dashboard/today">View Today's Entries</Link>
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
