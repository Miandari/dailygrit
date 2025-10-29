'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { saveDailyEntry } from '@/app/actions/entries';
import { useRouter } from 'next/navigation';
import { FileUpload } from '@/components/ui/file-upload';

interface Metric {
  id: string;
  name: string;
  type: 'boolean' | 'number' | 'duration' | 'choice' | 'text' | 'file';
  required: boolean;
  config?: {
    min?: number;
    max?: number;
    options?: string[];
    allowMultiple?: boolean;
    maxLength?: number;
    placeholder?: string;
  };
}

interface DailyEntryFormProps {
  challenge: {
    id: string;
    name: string;
    metrics: Metric[];
    lock_entries_after_day: boolean;
  };
  participationId: string;
  existingEntry?: any;
  isLocked?: boolean;
  targetDate?: string; // YYYY-MM-DD format, defaults to today
}

export default function DailyEntryForm({
  challenge,
  participationId,
  existingEntry,
  isLocked = false,
  targetDate,
}: DailyEntryFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<Record<string, any>>(
    existingEntry?.metric_data || {}
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Validate required fields
      for (const metric of challenge.metrics) {
        if (metric.required && !formData[metric.id]) {
          setError(`Please complete the required field: ${metric.name}`);
          setIsSubmitting(false);
          return;
        }
      }

      const result = await saveDailyEntry({
        participantId: participationId,
        metricData: formData,
        isCompleted: true,
        notes: formData.notes || '',
        targetDate: targetDate,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to save entry');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateMetricValue = (metricId: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [metricId]: value,
    }));
  };

  const renderMetricInput = (metric: Metric) => {
    const value = formData[metric.id];

    switch (metric.type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={metric.id}
              checked={value || false}
              onCheckedChange={(checked) => updateMetricValue(metric.id, checked)}
              disabled={isLocked}
            />
            <Label htmlFor={metric.id} className="text-sm font-normal cursor-pointer">
              {metric.name}
            </Label>
          </div>
        );

      case 'number':
        return (
          <div className="space-y-2">
            <Label htmlFor={metric.id}>
              {metric.name}
              {metric.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={metric.id}
              type="number"
              value={value || ''}
              onChange={(e) => updateMetricValue(metric.id, parseFloat(e.target.value) || 0)}
              min={metric.config?.min}
              max={metric.config?.max}
              placeholder={metric.config?.placeholder}
              disabled={isLocked}
              required={metric.required}
            />
            {metric.config?.min !== undefined && metric.config?.max !== undefined && (
              <p className="text-xs text-gray-500">
                Range: {metric.config.min} - {metric.config.max}
              </p>
            )}
          </div>
        );

      case 'duration':
        return (
          <div className="space-y-2">
            <Label htmlFor={metric.id}>
              {metric.name}
              {metric.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <Input
                  id={`${metric.id}-hours`}
                  type="number"
                  min="0"
                  max="23"
                  value={Math.floor((value || 0) / 60)}
                  onChange={(e) => {
                    const hours = parseInt(e.target.value) || 0;
                    const currentMinutes = (value || 0) % 60;
                    updateMetricValue(metric.id, hours * 60 + currentMinutes);
                  }}
                  placeholder="0"
                  disabled={isLocked}
                />
                <span className="text-xs text-gray-500 ml-1">hours</span>
              </div>
              <div className="flex-1">
                <Input
                  id={`${metric.id}-minutes`}
                  type="number"
                  min="0"
                  max="59"
                  value={(value || 0) % 60}
                  onChange={(e) => {
                    const minutes = parseInt(e.target.value) || 0;
                    const currentHours = Math.floor((value || 0) / 60);
                    updateMetricValue(metric.id, currentHours * 60 + minutes);
                  }}
                  placeholder="0"
                  disabled={isLocked}
                />
                <span className="text-xs text-gray-500 ml-1">minutes</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              Total: {Math.floor((value || 0) / 60)}h {(value || 0) % 60}m
            </p>
          </div>
        );

      case 'choice':
        return (
          <div className="space-y-2">
            <Label>
              {metric.name}
              {metric.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {metric.config?.allowMultiple ? (
              <div className="space-y-2">
                {metric.config.options?.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${metric.id}-${option}`}
                      checked={Array.isArray(value) && value.includes(option)}
                      onCheckedChange={(checked) => {
                        const currentValue = Array.isArray(value) ? value : [];
                        if (checked) {
                          updateMetricValue(metric.id, [...currentValue, option]);
                        } else {
                          updateMetricValue(metric.id, currentValue.filter((v) => v !== option));
                        }
                      }}
                      disabled={isLocked}
                    />
                    <Label
                      htmlFor={`${metric.id}-${option}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <RadioGroup
                value={value || ''}
                onValueChange={(val) => updateMetricValue(metric.id, val)}
                disabled={isLocked}
              >
                {metric.config?.options?.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`${metric.id}-${option}`} />
                    <Label htmlFor={`${metric.id}-${option}`} className="font-normal cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </div>
        );

      case 'text':
        return (
          <div className="space-y-2">
            <Label htmlFor={metric.id}>
              {metric.name}
              {metric.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={metric.id}
              value={value || ''}
              onChange={(e) => updateMetricValue(metric.id, e.target.value)}
              placeholder={metric.config?.placeholder}
              maxLength={metric.config?.maxLength}
              disabled={isLocked}
              required={metric.required}
              rows={3}
            />
            {metric.config?.maxLength && (
              <p className="text-xs text-gray-500 text-right">
                {(value || '').length}/{metric.config.maxLength}
              </p>
            )}
          </div>
        );

      case 'file':
        return (
          <div className="space-y-2">
            <Label htmlFor={metric.id}>
              {metric.name}
              {metric.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <FileUpload
              onUpload={(urls) => updateMetricValue(metric.id, urls)}
              maxFiles={3}
              existingUrls={Array.isArray(value) ? value : []}
              disabled={isLocked}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Metrics */}
      <div className="space-y-4">
        {challenge.metrics.map((metric) => (
          <Card key={metric.id} className="p-4">
            {renderMetricInput(metric)}
          </Card>
        ))}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={formData.notes || ''}
          onChange={(e) => updateMetricValue('notes', e.target.value)}
          placeholder="Any additional thoughts or reflections..."
          disabled={isLocked}
          rows={3}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={isSubmitting || isLocked}
          className="flex-1"
        >
          {isSubmitting ? 'Saving...' : existingEntry ? 'Update Entry' : 'Save Entry'}
        </Button>
        {challenge.lock_entries_after_day && !isLocked && (
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              // Save and lock
              await handleSubmit(new Event('submit') as any);
              // The lock will be handled by the server action
            }}
            disabled={isSubmitting}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Save & Lock
          </Button>
        )}
      </div>

      {challenge.lock_entries_after_day && (
        <p className="text-xs text-gray-500 text-center">
          Note: Entries will be automatically locked after submission if configured
        </p>
      )}
    </form>
  );
}