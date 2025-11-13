'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { StepIndicator } from '@/components/challenges/create/StepIndicator';
import { Step1BasicInfo } from '@/components/challenges/create/Step1BasicInfo';
import { Step2Metrics } from '@/components/challenges/create/Step2Metrics';
import { Step3Settings } from '@/components/challenges/create/Step3Settings';
import { Step4Review } from '@/components/challenges/create/Step4Review';
import { TemplateSelectionScreen } from '@/components/challenges/create/TemplateSelectionScreen';
import { useChallengeWizardStore } from '@/lib/stores/challengeStore';
import { useAuth } from '@/lib/hooks/useAuth';
import { ChallengeTemplate } from '@/lib/templates/challengeTemplates';

export default function CreateChallengePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { currentStep, nextStep, prevStep, setStep, reset, loadFromTemplate } = useChallengeWizardStore();
  const [templateSelected, setTemplateSelected] = useState(false);

  // Reset wizard state when component mounts
  useEffect(() => {
    reset();
    setTemplateSelected(false);
  }, [reset]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleTemplateSelection = (template: ChallengeTemplate | null) => {
    if (template) {
      loadFromTemplate(template);
    }
    setTemplateSelected(true);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1BasicInfo onNext={nextStep} />;
      case 2:
        return <Step2Metrics onNext={nextStep} onPrev={prevStep} />;
      case 3:
        return <Step3Settings onNext={nextStep} onPrev={prevStep} />;
      case 4:
        return <Step4Review onPrev={prevStep} />;
      default:
        return <Step1BasicInfo onNext={nextStep} />;
    }
  };

  // Show template selection screen if not yet selected
  if (!templateSelected) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Create New Challenge</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Choose a template or start from scratch to create your challenge
            </p>
          </div>

          <Card>
            <CardContent className="p-6">
              <TemplateSelectionScreen onSelectTemplate={handleTemplateSelection} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show wizard steps after template selection
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Create New Challenge</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Set up a challenge with custom metrics to track your daily progress
          </p>
        </div>

        <StepIndicator currentStep={currentStep} />

        <Card>
          <CardContent className="p-6">{renderStep()}</CardContent>
        </Card>
      </div>
    </div>
  );
}