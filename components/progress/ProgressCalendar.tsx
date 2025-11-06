'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';

interface DailyEntry {
  entry_date: string;
  is_completed: boolean;
  points_earned?: number;
  bonus_points?: number;
  submitted_at?: string;
}

interface ProgressCalendarProps {
  entries: DailyEntry[];
  challengeStartDate: Date;
  challengeEndDate: Date;
}

export function ProgressCalendar({ entries, challengeStartDate, challengeEndDate }: ProgressCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Create a map of dates to entries for quick lookup
  const entryMap = new Map(
    entries.map(entry => [entry.entry_date, entry])
  );

  const getDayStatus = (day: Date): 'completed' | 'late' | 'missed' | 'today' | 'future' | 'outside' => {
    const dayStr = format(day, 'yyyy-MM-dd');

    // Create copies to avoid mutation and normalize to midnight local time
    const dayMidnight = new Date(day);
    dayMidnight.setHours(0, 0, 0, 0);

    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    const startMidnight = new Date(challengeStartDate);
    startMidnight.setHours(0, 0, 0, 0);

    const endMidnight = new Date(challengeEndDate);
    endMidnight.setHours(0, 0, 0, 0);

    // Check if day is outside challenge period
    if (dayMidnight < startMidnight || dayMidnight > endMidnight) {
      return 'outside';
    }

    // Check if day is in the future
    if (dayMidnight > todayMidnight) {
      return 'future';
    }

    // Check if day is today
    if (dayMidnight.getTime() === todayMidnight.getTime()) {
      const entry = entryMap.get(dayStr);
      if (entry?.is_completed) {
        return 'completed';
      }
      return 'today';
    }

    // Check if there's an entry for this day (past days only)
    const entry = entryMap.get(dayStr);
    if (entry?.is_completed) {
      // Check if it was submitted late (after the entry_date)
      if (entry.submitted_at && entry.entry_date) {
        // Compare the submission date (in local time) with the entry_date
        const submittedDate = new Date(entry.submitted_at);
        const submittedDateStr = `${submittedDate.getFullYear()}-${String(submittedDate.getMonth() + 1).padStart(2, '0')}-${String(submittedDate.getDate()).padStart(2, '0')}`;
        // If submitted on a different day than entry_date, it's late
        if (submittedDateStr > entry.entry_date) {
          return 'late';
        }
      }
      return 'completed';
    }

    return 'missed';
  };

  const getDayPoints = (day: Date, status: string): number | null => {
    if (status === 'completed' || status === 'late' || status === 'missed') {
      const dayStr = format(day, 'yyyy-MM-dd');
      const entry = entryMap.get(dayStr);
      if (entry) {
        return (entry.points_earned || 0) + (entry.bonus_points || 0);
      }
      return 0; // Missed day = 0 points
    }
    return null; // Today, future, or outside - no points to show
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Pad the start of the month to align with day of week
  const firstDayOfMonth = monthDays[0].getDay();
  const paddedDays = Array.from({ length: firstDayOfMonth }, (_, i) => {
    const day = new Date(monthStart);
    day.setDate(day.getDate() - (firstDayOfMonth - i));
    return day;
  });

  const allDays = [...paddedDays, ...monthDays];

  return (
    <div className="bg-card rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Progress Calendar</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[120px] text-center font-medium">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 pb-2">
            {day}
          </div>
        ))}

        {allDays.map((day, index) => {
          const status = getDayStatus(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const points = getDayPoints(day, status);

          return (
            <div
              key={index}
              className={cn(
                'aspect-square flex flex-col items-center justify-center rounded-lg border-2 transition-colors',
                !isCurrentMonth && 'opacity-50',
                status === 'completed' && 'border-green-500 bg-green-50',
                status === 'late' && 'border-yellow-500 bg-yellow-50',
                status === 'missed' && 'border-red-400 bg-red-50',
                status === 'today' && 'border-blue-500 bg-blue-50',
                status === 'future' && 'border-gray-200 bg-card',
                status === 'outside' && 'border-gray-100 bg-gray-50'
              )}
            >
              <span className={cn(
                'text-xs font-medium mb-0.5',
                !isCurrentMonth && 'text-gray-400',
                status === 'outside' && 'text-gray-300'
              )}>
                {format(day, 'd')}
              </span>
              {points !== null ? (
                <span className={cn(
                  'text-sm font-bold',
                  status === 'completed' && 'text-green-700',
                  status === 'late' && 'text-yellow-700',
                  status === 'missed' && 'text-red-600'
                )}>
                  {points}
                </span>
              ) : status === 'outside' ? (
                <Minus className="h-4 w-4 text-gray-300" />
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-4 mt-6 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-green-500 bg-green-50 rounded flex items-center justify-center">
            <span className="text-xs font-bold text-green-700">12</span>
          </div>
          <span>On Time</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-yellow-500 bg-yellow-50 rounded flex items-center justify-center">
            <span className="text-xs font-bold text-yellow-700">8</span>
          </div>
          <span>Late</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-blue-500 bg-blue-50 rounded" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-red-400 bg-red-50 rounded flex items-center justify-center">
            <span className="text-xs font-bold text-red-600">0</span>
          </div>
          <span>Missed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-gray-200 bg-card rounded" />
          <span>Upcoming</span>
        </div>
      </div>
    </div>
  );
}