'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useChallengeWizardStore } from '@/lib/stores/challengeStore';
import { Info } from 'lucide-react';

const step3Schema = z.object({
  is_public: z.boolean(),
  is_template: z.boolean(),
  lock_entries_after_day: z.boolean(),
  show_participant_details: z.boolean(),
  failure_mode: z.enum(['strict', 'flexible', 'grace']),
});

type Step3FormData = z.infer<typeof step3Schema>;

interface Step3SettingsProps {
  onNext: () => void;
  onPrev: () => void;
}

export function Step3Settings({ onNext, onPrev }: Step3SettingsProps) {
  const { formData, updateFormData } = useChallengeWizardStore();

  const {
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<Step3FormData>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      is_public: formData.is_public ?? true,
      is_template: formData.is_template ?? false,
      lock_entries_after_day: formData.lock_entries_after_day ?? false,
      show_participant_details: formData.show_participant_details ?? true,
      failure_mode: formData.failure_mode ?? 'flexible',
    },
  });

  const watchIsPublic = watch('is_public');
  const watchFailureMode = watch('failure_mode');
  const watchLockEntries = watch('lock_entries_after_day');
  const watchIsTemplate = watch('is_template');
  const watchShowParticipantDetails = watch('show_participant_details');

  const onSubmit = (data: Step3FormData) => {
    updateFormData(data);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Privacy Settings</CardTitle>
          <CardDescription>Control who can see and join your challenge</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={watchIsPublic ? 'public' : 'private'}
            onValueChange={(value) => setValue('is_public', value === 'public')}
          >
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="public" id="public" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="public" className="font-medium">
                  Public Challenge
                </Label>
                <p className="text-sm text-gray-600">
                  Anyone can discover and join this challenge
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-start space-x-3">
              <RadioGroupItem value="private" id="private" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="private" className="font-medium">
                  Private Challenge
                </Label>
                <p className="text-sm text-gray-600">
                  Only people with an invite code can join
                </p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Failure Rules</CardTitle>
          <CardDescription>What happens when someone misses a day?</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={watchFailureMode} onValueChange={(value: any) => setValue('failure_mode', value)}>
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="strict" id="strict" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="strict" className="font-medium">
                  Strict Mode
                </Label>
                <p className="text-sm text-gray-600">
                  Missing a day means starting over from Day 1 (like 75 Hard)
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-start space-x-3">
              <RadioGroupItem value="flexible" id="flexible" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="flexible" className="font-medium">
                  Flexible Mode
                </Label>
                <p className="text-sm text-gray-600">
                  Can continue with missed days showing as incomplete
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-start space-x-3">
              <RadioGroupItem value="grace" id="grace" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="grace" className="font-medium">
                  Grace Period
                </Label>
                <p className="text-sm text-gray-600">
                  Can complete previous day's entry until end of next day
                </p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="lock_entries"
              checked={watchLockEntries}
              onChange={(e) => setValue('lock_entries_after_day', e.target.checked)}
              className="mt-1"
            />
            <div className="flex-1">
              <Label htmlFor="lock_entries" className="font-medium cursor-pointer">
                Lock daily entries after submission
              </Label>
              <p className="text-sm text-gray-600">
                Prevent editing once a day's entry is submitted
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="is_template"
              checked={watchIsTemplate}
              onChange={(e) => setValue('is_template', e.target.checked)}
              className="mt-1"
            />
            <div className="flex-1">
              <Label htmlFor="is_template" className="font-medium cursor-pointer">
                Save as template
              </Label>
              <p className="text-sm text-gray-600">
                Allow others to copy this challenge structure
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="show_participant_details"
              checked={watchShowParticipantDetails}
              onChange={(e) => setValue('show_participant_details', e.target.checked)}
              className="mt-1"
            />
            <div className="flex-1">
              <Label htmlFor="show_participant_details" className="font-medium cursor-pointer">
                Show participant details to other members
              </Label>
              <p className="text-sm text-gray-600">
                Allow participants to see each other's full progress including metric data and notes
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg bg-blue-50 p-4">
        <div className="flex">
          <Info className="h-5 w-5 text-blue-600" />
          <div className="ml-3">
            <p className="text-sm text-blue-900">
              You can change these settings later, except for the failure mode which is locked
              once participants join.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev}>
          Previous
        </Button>
        <Button type="submit">Review & Create</Button>
      </div>
    </form>
  );
}