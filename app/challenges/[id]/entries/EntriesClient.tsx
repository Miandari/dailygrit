'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import DailyEntryForm from '@/components/daily-entry/DailyEntryForm';
import { DateSelector } from '@/components/challenges/DateSelector';

interface EntriesClientProps {
  challenge: any;
  participantId: string;
  entries: any[];
  challengeStartDate: Date;
  challengeEndDate: Date;
}

export default function EntriesClient({
  challenge,
  participantId,
  entries,
  challengeStartDate,
  challengeEndDate,
}: EntriesClientProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(format(new Date(), 'yyyy-MM-dd'));

  const entryMap = new Map(entries.map(e => [e.entry_date, e]));
  const selectedEntry = selectedDate ? entryMap.get(selectedDate) : null;

  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');
  const isLate = selectedEntry?.submitted_at && selectedEntry?.is_completed && selectedEntry?.entry_date &&
    (() => {
      const submittedDate = new Date(selectedEntry.submitted_at);
      const submittedDateStr = `${submittedDate.getFullYear()}-${String(submittedDate.getMonth() + 1).padStart(2, '0')}-${String(submittedDate.getDate()).padStart(2, '0')}`;
      return submittedDateStr > selectedEntry.entry_date;
    })();

  return (
    <div className="grid md:grid-cols-[280px,1fr] gap-6">
      {/* Date Selector */}
      <div>
        <DateSelector
          challengeStartDate={challengeStartDate}
          challengeEndDate={challengeEndDate}
          entries={entries}
          onDateSelect={setSelectedDate}
          selectedDate={selectedDate}
        />
      </div>

      {/* Entry Form */}
      <div>
        {selectedDate ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {isToday && <Badge>Today</Badge>}
                  {selectedEntry?.is_completed ? (
                    <>
                      {isLate && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                          <Clock className="mr-1 h-3 w-3" />
                          Late
                        </Badge>
                      )}
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Completed
                      </Badge>
                      <span className="font-bold text-lg">
                        {(selectedEntry.points_earned || 0) + (selectedEntry.bonus_points || 0)} pts
                      </span>
                    </>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                      <XCircle className="mr-1 h-3 w-3" />
                      Not Completed
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DailyEntryForm
                challenge={challenge}
                participationId={participantId}
                existingEntry={selectedEntry || null}
                targetDate={selectedDate}
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12 text-center text-gray-500">
              Select a day from the list to view or edit your entry
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
