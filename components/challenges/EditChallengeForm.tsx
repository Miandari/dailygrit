'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { recalculateAllPoints } from '@/app/actions/recalculatePoints';
import { MetricFormData } from '@/lib/validations/challenge';

interface EditChallengeFormProps {
  challenge: any;
}

export default function EditChallengeForm({ challenge }: EditChallengeFormProps) {
  const router = useRouter();
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [recalculateMessage, setRecalculateMessage] = useState('');
  const [error, setError] = useState('');

  const metrics = (challenge.metrics as MetricFormData[]) || [];
  const totalPossiblePoints = metrics.reduce((sum, m) => sum + (m.points || 1), 0);

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    setError('');
    setRecalculateMessage('');

    try {
      const result = await recalculateAllPoints(challenge.id);

      if (result.success) {
        setRecalculateMessage(
          `Successfully recalculated ${result.recalculated} entries!`
        );
        router.refresh();
      } else {
        setError(result.error || 'Failed to recalculate points');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Metrics & Points</CardTitle>
          <CardDescription>
            Current scoring configuration for this challenge
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.map((metric, index) => (
              <div
                key={metric.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex-1">
                  <div className="font-medium">{metric.name}</div>
                  <div className="text-sm text-gray-500">
                    Type: {metric.type}
                    {metric.threshold !== undefined && ` • Threshold: ${metric.threshold}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">
                    {metric.points || 1} pts
                  </div>
                </div>
              </div>
            ))}

            <div className="border-t pt-3 flex justify-between items-center">
              <span className="font-medium">Total Possible Points per Day:</span>
              <span className="text-xl font-bold text-blue-600">
                {totalPossiblePoints} pts
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bonus Points */}
      <Card>
        <CardHeader>
          <CardTitle>Bonus Points</CardTitle>
          <CardDescription>Current bonus configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Streak Bonus</div>
              <div className="text-sm text-gray-500">
                {challenge.enable_streak_bonus
                  ? `Enabled: ${challenge.streak_bonus_points} points per streak day`
                  : 'Disabled'}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Perfect Day Bonus</div>
              <div className="text-sm text-gray-500">
                {challenge.enable_perfect_day_bonus
                  ? `Enabled: ${challenge.perfect_day_bonus_points} points`
                  : 'Disabled'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recalculate Points */}
      <Card>
        <CardHeader>
          <CardTitle>Recalculate All Points</CardTitle>
          <CardDescription>
            Recalculate points for all existing entries based on the current scoring
            configuration. This will update all participant scores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {recalculateMessage && (
              <Alert>
                <AlertDescription>{recalculateMessage}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleRecalculate}
                disabled={isRecalculating}
                className="flex-1"
              >
                {isRecalculating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isRecalculating ? 'Recalculating...' : 'Recalculate All Points'}
              </Button>
            </div>

            <p className="text-xs text-gray-500">
              Note: This operation may take a few moments if there are many entries.
              All participants' scores will be updated based on their entry data.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => router.push(`/challenges/${challenge.id}`)}
        >
          Back to Challenge
        </Button>
      </div>
    </div>
  );
}
