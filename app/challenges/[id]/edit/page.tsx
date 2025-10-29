import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import EditChallengeForm from '@/components/challenges/EditChallengeForm';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function EditChallengePage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch challenge
  const { data: challenge, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !challenge) {
    notFound();
  }

  // Verify user is the creator
  if (challenge.creator_id !== user.id) {
    redirect(`/challenges/${id}`);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4">
            <Link href={`/challenges/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Challenge
            </Link>
          </Button>

          <h1 className="text-3xl font-bold text-gray-900">Edit Challenge Settings</h1>
          <p className="mt-2 text-gray-600">{challenge.name}</p>
        </div>

        <EditChallengeForm challenge={challenge} />
      </div>
    </div>
  );
}
