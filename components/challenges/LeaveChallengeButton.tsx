'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { leaveChallenge } from '@/app/actions/challenges';
import { LogOut } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface LeaveChallengeButtonProps {
  challengeId: string;
  challengeName: string;
}

export default function LeaveChallengeButton({
  challengeId,
  challengeName,
}: LeaveChallengeButtonProps) {
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLeave = async () => {
    setIsLeaving(true);
    setError(null);

    try {
      const result = await leaveChallenge(challengeId);

      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.error || 'Failed to leave challenge');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={isLeaving}>
          <LogOut className="mr-2 h-4 w-4" />
          {isLeaving ? 'Leaving...' : 'Leave Challenge'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave this challenge?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to leave "{challengeName}"? You will lose your current
            streak and progress, but you can rejoin later if the challenge is still active.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
            {error}
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLeaving}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLeave}
            disabled={isLeaving}
          >
            {isLeaving ? 'Leaving...' : 'Leave Challenge'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}