'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { Loader2, UserMinus } from 'lucide-react';
import { removeParticipant } from '@/app/actions/participants';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface RemoveParticipantButtonProps {
  participantId: string;
  participantName: string;
  challengeId: string;
}

export default function RemoveParticipantButton({
  participantId,
  participantName,
  challengeId,
}: RemoveParticipantButtonProps) {
  const router = useRouter();
  const [isRemoving, setIsRemoving] = useState(false);
  const [open, setOpen] = useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);

    const result = await removeParticipant(participantId, challengeId);

    if (result.success) {
      toast.success(`Removed ${participantName} from challenge`);
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to remove participant');
      setIsRemoving(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <UserMinus className="mr-2 h-4 w-4" />
          Remove
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Participant</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove {participantName} from this challenge?
            This action cannot be undone and they will lose all their progress.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleRemove();
            }}
            disabled={isRemoving}
            className="bg-red-600 hover:bg-red-700"
          >
            {isRemoving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isRemoving ? 'Removing...' : 'Remove Participant'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
