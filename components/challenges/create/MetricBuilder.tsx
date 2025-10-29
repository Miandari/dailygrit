'use client';

import { useState } from 'react';
import { Plus, Trash2, GripVertical, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { defaultMetricTemplates } from '@/lib/validations/challenge';
import { MetricFormData } from '@/lib/validations/challenge';

interface MetricBuilderProps {
  metric: Partial<MetricFormData>;
  onSave: (metric: Partial<MetricFormData>) => void;
  onCancel: () => void;
}

export function MetricBuilder({ metric, onSave, onCancel }: MetricBuilderProps) {
  const [formData, setFormData] = useState<Partial<MetricFormData>>({
    ...defaultMetricTemplates[metric.type as keyof typeof defaultMetricTemplates] || {},
    ...metric,
  });
  const [options, setOptions] = useState<string[]>(
    (formData.config?.options as string[]) || ['Option 1', 'Option 2']
  );

  const handleTypeChange = (type: MetricFormData['type']) => {
    const template = defaultMetricTemplates[type as keyof typeof defaultMetricTemplates];
    setFormData({
      ...formData,
      type,
      config: template.config,
    });
    if (type === 'choice') {
      setOptions(['Option 1', 'Option 2']);
    }
  };

  const handleSave = () => {
    if (formData.type === 'choice') {
      formData.config = { ...formData.config, options };
    }
    onSave(formData);
  };

  const addOption = () => {
    setOptions([...options, `Option ${options.length + 1}`]);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="metric-name">Metric Name *</Label>
        <Input
          id="metric-name"
          value={formData.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Workout completed"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="metric-type">Type *</Label>
        <Select value={formData.type} onValueChange={handleTypeChange}>
          <SelectTrigger id="metric-type" className="mt-1">
            <SelectValue placeholder="Select metric type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="boolean">Yes/No Checkbox</SelectItem>
            <SelectItem value="number">Number</SelectItem>
            <SelectItem value="duration">Duration (Time)</SelectItem>
            <SelectItem value="choice">Multiple Choice</SelectItem>
            <SelectItem value="text">Text Entry</SelectItem>
            <SelectItem value="file">File Upload</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Type-specific configuration */}
      {formData.type === 'number' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min">Minimum Value</Label>
              <Input
                id="min"
                type="number"
                value={formData.config?.min || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...formData.config, min: Number(e.target.value) },
                  })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="max">Maximum Value</Label>
              <Input
                id="max"
                type="number"
                value={formData.config?.max || 100}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...formData.config, max: Number(e.target.value) },
                  })
                }
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="units">Units (optional)</Label>
            <Input
              id="units"
              value={formData.config?.units || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...formData.config, units: e.target.value },
                })
              }
              placeholder="e.g., reps, miles, kg"
              className="mt-1"
            />
          </div>
        </div>
      )}

      {formData.type === 'duration' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="duration-min">Minimum (minutes)</Label>
            <Input
              id="duration-min"
              type="number"
              value={formData.config?.min || 0}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...formData.config, min: Number(e.target.value) },
                })
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="duration-max">Maximum (minutes)</Label>
            <Input
              id="duration-max"
              type="number"
              value={formData.config?.max || 1440}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...formData.config, max: Number(e.target.value) },
                })
              }
              className="mt-1"
            />
          </div>
        </div>
      )}

      {formData.type === 'choice' && (
        <div className="space-y-2">
          <Label>Options</Label>
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
              />
              {options.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOption(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addOption}>
            <Plus className="mr-1 h-4 w-4" />
            Add Option
          </Button>
        </div>
      )}

      {formData.type === 'text' && (
        <div>
          <Label htmlFor="max-length">Maximum Length</Label>
          <Input
            id="max-length"
            type="number"
            value={formData.config?.maxLength || 500}
            onChange={(e) =>
              setFormData({
                ...formData,
                config: { ...formData.config, maxLength: Number(e.target.value) },
              })
            }
            className="mt-1"
          />
        </div>
      )}

      {formData.type === 'file' && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="max-size">Maximum File Size (MB)</Label>
            <Input
              id="max-size"
              type="number"
              value={formData.config?.maxSizeMB || 10}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...formData.config, maxSizeMB: Number(e.target.value) },
                })
              }
              className="mt-1"
            />
          </div>
        </div>
      )}

      {/* Scoring Configuration */}
      <div className="border-t pt-4 space-y-4">
        <h4 className="font-medium text-sm">Scoring Configuration</h4>

        <div>
          <Label htmlFor="points">Points *</Label>
          <Input
            id="points"
            type="number"
            min="0"
            value={formData.points || 1}
            onChange={(e) =>
              setFormData({ ...formData, points: Number(e.target.value) })
            }
            placeholder="1"
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Points awarded when this metric is completed
          </p>
        </div>

        {(formData.type === 'number' || formData.type === 'duration') && (
          <div>
            <Label htmlFor="threshold">Minimum for Full Points</Label>
            <Input
              id="threshold"
              type="number"
              min="0"
              value={formData.threshold || 0}
              onChange={(e) =>
                setFormData({ ...formData, threshold: Number(e.target.value), scoring_mode: 'binary' })
              }
              placeholder="0"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              User must reach this value to earn full points
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="required"
          checked={formData.required !== false}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, required: checked as boolean })
          }
        />
        <Label htmlFor="required">Required field</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={!formData.name || !formData.type}
        >
          Save Metric
        </Button>
      </div>
    </div>
  );
}