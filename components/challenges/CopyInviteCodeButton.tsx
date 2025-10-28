'use client';

import { Button } from '@/components/ui/button';

interface CopyInviteCodeButtonProps {
  inviteCode: string;
}

export default function CopyInviteCodeButton({ inviteCode }: CopyInviteCodeButtonProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode);
  };

  return (
    <Button variant="outline" onClick={handleCopy}>
      Copy Code
    </Button>
  );
}
