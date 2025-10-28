'use client';

import { Flame, Trophy, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  completedDays: number;
}

export function StreakDisplay({
  currentStreak,
  longestStreak,
  totalDays,
  completedDays
}: StreakDisplayProps) {
  const completionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '🔥';
    if (streak >= 7) return '⭐';
    if (streak >= 3) return '✨';
    return '💫';
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="flex items-center p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
            <Flame className="h-6 w-6 text-orange-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Current Streak</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{currentStreak}</p>
              <span className="text-xl">{getStreakEmoji(currentStreak)}</span>
            </div>
            <p className="text-xs text-gray-500">days in a row</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
            <Trophy className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Longest Streak</p>
            <p className="text-2xl font-bold">{longestStreak}</p>
            <p className="text-xs text-gray-500">personal best</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Completion Rate</p>
            <p className="text-2xl font-bold">{completionRate}%</p>
            <p className="text-xs text-gray-500">{completedDays}/{totalDays} days</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
            <Calendar className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Days</p>
            <p className="text-2xl font-bold">{completedDays}</p>
            <p className="text-xs text-gray-500">completed</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}