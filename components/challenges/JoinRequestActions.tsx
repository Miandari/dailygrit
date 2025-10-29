'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Check, X } from 'lucide-react';
import { approveJoinRequest, rejectJoinRequest } from '@/app/actions/joinRequests';
import { useRouter } from 'next/navigation';

interface JoinRequestActionsProps {
  requestId: string;
}

export default function JoinRequestActions({ requestId }: JoinRequestActionsProps) {
  const router = useRouter();
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [error, setError] = useState('');

  const handleApprove = async () => {
    setIsApproving(true);
    setError('');

    const result = await approveJoinRequest(requestId);

    if (result.success) {
      router.refresh();
    } else {
      setError(result.error || 'Failed to approve request');
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    setError('');

    const result = await rejectJoinRequest(requestId);

    if (result.success) {
      router.refresh();
    } else {
      setError(result.error || 'Failed to reject request');
      setIsRejecting(false);
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="default"
          onClick={handleApprove}
          disabled={isApproving || isRejecting}
        >
          {isApproving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {!isApproving && <Check className="mr-2 h-4 w-4" />}
          Approve
        </Button>

        <Button
          size="sm"
          variant="destructive"
          onClick={handleReject}
          disabled={isApproving || isRejecting}
        >
          {isRejecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {!isRejecting && <X className="mr-2 h-4 w-4" />}
          Reject
        </Button>
      </div>

      {error && (
        <p className="text-xs text-red-600 mt-2">{error}</p>
      )}
    </div>
  );
}
