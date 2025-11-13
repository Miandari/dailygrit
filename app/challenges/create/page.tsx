import { Suspense } from 'react';
import CreateChallengeContent from './CreateChallengeContent';

export default function CreateChallengePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <CreateChallengeContent />
    </Suspense>
  );
}
