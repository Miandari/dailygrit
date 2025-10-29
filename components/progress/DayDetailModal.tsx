'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, Clock, FileText } from 'lucide-react';

interface DailyEntry {
  entry_date: string;
  is_completed: boolean;
  points_earned?: number;
  bonus_points?: number;
  submitted_at?: string;
  metric_data?: any;
  notes?: string;
}

interface DayDetailModalProps {
  date: Date;
  entry: DailyEntry | null;
  username: string;
  isOpen: boolean;
  onClose: () => void;
}

export function DayDetailModal({
  date,
  entry,
  username,
  isOpen,
  onClose
}: DayDetailModalProps) {
  const totalPoints = entry ? (entry.points_earned || 0) + (entry.bonus_points || 0) : 0;
  const isLate = entry?.submitted_at
    ? new Date(entry.submitted_at).toDateString() !== date.toDateString()
    : false;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {format(date, 'MMMM d, yyyy')}
          </DialogTitle>
          <DialogDescription>
            {username}&apos;s activity for this day
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Card */}
          <div className={`rounded-lg p-4 ${
            entry?.is_completed
              ? isLate
                ? 'bg-yellow-50 border-2 border-yellow-500'
                : 'bg-green-50 border-2 border-green-500'
              : 'bg-red-50 border-2 border-red-400'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {entry?.is_completed ? (
                  isLate ? (
                    <Clock className="h-6 w-6 text-yellow-600" />
                  ) : (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  )
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
                <div>
                  <div className="font-semibold text-lg">
                    {entry?.is_completed
                      ? isLate
                        ? 'Completed Late'
                        : 'Completed'
                      : 'Not Completed'
                    }
                  </div>
                  {entry?.submitted_at && (
                    <div className="text-sm text-gray-600">
                      Submitted: {format(new Date(entry.submitted_at), 'MMM d, yyyy h:mm a')}
                    </div>
                  )}
                </div>
              </div>
              {entry?.is_completed && (
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">{totalPoints}</div>
                  <div className="text-xs text-gray-500">points</div>
                </div>
              )}
            </div>

            {entry?.is_completed && (entry.points_earned || entry.bonus_points) && (
              <div className="mt-3 pt-3 border-t border-gray-200 flex gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Base points: </span>
                  <span className="font-semibold">{entry.points_earned || 0}</span>
                </div>
                {entry.bonus_points ? (
                  <div>
                    <span className="text-gray-600">Bonus points: </span>
                    <span className="font-semibold text-amber-600">+{entry.bonus_points}</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Metrics Data */}
          {entry?.metric_data && Object.keys(entry.metric_data).length > 0 && (
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Metrics
              </h3>
              <div className="space-y-3">
                {Object.entries(entry.metric_data).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex justify-between items-center py-2 border-b last:border-0">
                    <span className="text-gray-600 font-medium capitalize">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {typeof value === 'boolean'
                        ? value ? 'Yes' : 'No'
                        : typeof value === 'number'
                        ? value.toLocaleString()
                        : value?.toString() || 'N/A'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {entry?.notes && (
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-semibold text-lg mb-3">Notes</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{entry.notes}</p>
            </div>
          )}

          {/* No Entry Message */}
          {!entry && (
            <div className="text-center py-8 text-gray-500">
              <XCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium">No entry for this day</p>
              <p className="text-sm mt-1">This day was missed or not yet logged</p>
            </div>
          )}

          {/* Empty Entry */}
          {entry && !entry.is_completed && !entry.metric_data && !entry.notes && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No additional details available</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
