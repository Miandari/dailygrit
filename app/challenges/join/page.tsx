'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { joinChallengeWithCode } from '@/app/actions/challenges';

export default function JoinWithCodePage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await joinChallengeWithCode(inviteCode.trim().toUpperCase());

      if (result.success && result.challengeId) {
        router.push(`/challenges/${result.challengeId}`);
      } else {
        setError(result.error || 'Failed to join challenge');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Join Private Challenge</CardTitle>
          <CardDescription>
            Enter the invite code shared by the challenge creator
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteCode">Invite Code</Label>
              <Input
                id="inviteCode"
                type="text"
                placeholder="e.g., ABC12345"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                maxLength={8}
                required
                disabled={isLoading}
                className="text-center text-2xl font-mono tracking-wider"
              />
              <p className="text-sm text-gray-600">
                The code is 8 characters and not case sensitive
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading || inviteCode.length !== 8} className="flex-1">
                {isLoading ? 'Joining...' : 'Join Challenge'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard')}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </form>

          <div className="mt-6 border-t pt-6">
            <p className="text-sm text-gray-600 mb-3">Looking for public challenges?</p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/challenges/browse')}
            >
              Browse Public Challenges
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}