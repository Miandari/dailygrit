'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';

interface DailyEntry {
  entry_date: string;
  is_completed: boolean;
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

  const getDayStatus = (day: Date): 'completed' | 'missed' | 'future' | 'outside' => {
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

    // Check if there's an entry for this day
    const entry = entryMap.get(dayStr);
    if (entry?.is_completed) {
      return 'completed';
    }

    return 'missed';
  };

  const getDayIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'missed':
        return <Circle className="h-5 w-5 text-red-400" />;
      case 'future':
        return <Circle className="h-5 w-5 text-gray-300" />;
      case 'outside':
        return <Minus className="h-5 w-5 text-gray-200" />;
      default:
        return null;
    }
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
    <div className="bg-white rounded-lg shadow p-6">
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
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={index}
              className={cn(
                'aspect-square flex flex-col items-center justify-center rounded-lg border',
                !isCurrentMonth && 'opacity-50',
                isToday && 'border-blue-500 border-2',
                status === 'completed' && 'bg-green-50',
                status === 'missed' && 'bg-red-50',
                status === 'outside' && 'bg-gray-50'
              )}
            >
              <span className={cn(
                'text-sm mb-1',
                !isCurrentMonth && 'text-gray-400'
              )}>
                {format(day, 'd')}
              </span>
              {getDayIcon(status)}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-6 mt-6 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <Circle className="h-4 w-4 text-red-400" />
          <span>Missed</span>
        </div>
        <div className="flex items-center gap-2">
          <Circle className="h-4 w-4 text-gray-300" />
          <span>Upcoming</span>
        </div>
      </div>
    </div>
  );
}