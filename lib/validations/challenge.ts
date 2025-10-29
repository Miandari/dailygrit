import { z } from 'zod';

// Metric validation schemas
export const metricConfigSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  units: z.string().optional(),
  options: z.array(z.string()).optional(),
  acceptedTypes: z.array(z.string()).optional(),
  maxSizeMB: z.number().optional(),
  maxLength: z.number().optional(),
  parentMetricId: z.string().optional(),
  showWhenParentValue: z.any().optional(),
});

export const metricSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Metric name is required').max(100),
  type: z.enum(['boolean', 'number', 'duration', 'choice', 'file', 'text', 'combined']),
  required: z.boolean().default(true),
  order: z.number(),
  config: metricConfigSchema,
});

// Challenge creation schema
export const challengeFormSchema = z.object({
  // Step 1: Basic Info
  name: z.string().min(3, 'Challenge name must be at least 3 characters').max(100),
  description: z.string().max(500).optional(),
  duration_days: z.number().min(1).max(365).default(30),
  starts_at: z.string().refine((date) => {
    const startDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return startDate >= today;
  }, 'Start date cannot be in the past'),

  // Step 2: Metrics (will be handled separately)
  metrics: z.array(metricSchema).min(1, 'At least one metric is required'),

  // Step 3: Settings
  is_public: z.boolean().default(true),
  is_template: z.boolean().default(false),
  lock_entries_after_day: z.boolean().default(false),
  show_participant_details: z.boolean().default(true),
  failure_mode: z.enum(['strict', 'flexible', 'grace']).default('flexible'),
});

export type ChallengeFormData = z.infer<typeof challengeFormSchema>;
export type MetricFormData = z.infer<typeof metricSchema>;

// Helper to generate unique metric ID
export function generateMetricId() {
  return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Default metric templates
export const defaultMetricTemplates = {
  boolean: {
    name: '',
    type: 'boolean' as const,
    required: true,
    config: {},
  },
  number: {
    name: '',
    type: 'number' as const,
    required: true,
    config: {
      min: 0,
      max: 100,
      units: '',
    },
  },
  duration: {
    name: '',
    type: 'duration' as const,
    required: true,
    config: {
      min: 0,
      max: 1440, // 24 hours in minutes
    },
  },
  choice: {
    name: '',
    type: 'choice' as const,
    required: true,
    config: {
      options: ['Option 1', 'Option 2'],
    },
  },
  file: {
    name: '',
    type: 'file' as const,
    required: true,
    config: {
      acceptedTypes: ['image/*'],
      maxSizeMB: 10,
    },
  },
  text: {
    name: '',
    type: 'text' as const,
    required: true,
    config: {
      maxLength: 500,
    },
  },
};