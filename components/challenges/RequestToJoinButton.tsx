'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { submitJoinRequest } from '@/app/actions/joinRequests';
import { useRouter } from 'next/navigation';

interface RequestToJoinButtonProps {
  challengeId: string;
  challengeName: string;
}

export default function RequestToJoinButton({ challengeId, challengeName }: RequestToJoinButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleRequest = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent Link navigation
    e.stopPropagation(); // Prevent card click

    setIsSubmitting(true);
    setError('');

    const result = await submitJoinRequest(challengeId);

    if (result.success) {
      router.refresh();
    } else {
      setError(result.error || 'Failed to send request');
      setIsSubmitting(false);
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Button
        size="sm"
        variant="outline"
        onClick={handleRequest}
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isSubmitting ? 'Sending Request...' : 'Request to Join'}
      </Button>
      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}
