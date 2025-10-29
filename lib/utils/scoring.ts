// Scoring system utilities

export type ScoringMode = 'binary' | 'scaled' | 'tiered';

export interface ScoreTier {
  threshold: number;
  points: number;
}

export interface MetricScoringConfig {
  points: number;
  scoring_mode?: ScoringMode;
  threshold?: number;
  tiers?: ScoreTier[];
}

export interface MetricWithScoring {
  id: string;
  name: string;
  type: string;
  required: boolean;
  config: any;
  points?: number;
  scoring_mode?: ScoringMode;
  threshold?: number;
  threshold_type?: 'min' | 'max';
  tiers?: ScoreTier[];
}

/**
 * Calculate points for a single metric based on its value and scoring configuration
 */
export function calculateMetricPoints(
  metric: MetricWithScoring,
  value: any
): number {
  const points = metric.points || 1;
  const scoringMode = metric.scoring_mode || 'binary';

  // If no value provided and metric is not required, return 0
  if (value === null || value === undefined || value === '') {
    return metric.required ? 0 : 0;
  }

  switch (metric.type) {
    case 'boolean':
      return value === true ? points : 0;

    case 'number':
    case 'duration':
      return calculateNumericPoints(
        Number(value),
        points,
        scoringMode,
        metric.threshold,
        metric.threshold_type,
        metric.tiers
      );

    case 'choice':
      // If value is selected, award points
      return value && value !== '' ? points : 0;

    case 'text':
      // If text is provided and meets minimum length, award points
      const text = String(value);
      return text.length > 0 ? points : 0;

    case 'file':
      // If file is uploaded, award points
      return value && (Array.isArray(value) ? value.length > 0 : true) ? points : 0;

    default:
      return 0;
  }
}

/**
 * Calculate points for numeric/duration metrics based on scoring mode
 */
function calculateNumericPoints(
  value: number,
  maxPoints: number,
  scoringMode: ScoringMode,
  threshold?: number,
  thresholdType: 'min' | 'max' = 'min',
  tiers?: ScoreTier[]
): number {
  if (scoringMode === 'binary') {
    const targetValue = threshold || 0;

    if (thresholdType === 'max') {
      // For max threshold: award points if value is AT MOST the threshold
      return value <= targetValue ? maxPoints : 0;
    } else {
      // For min threshold: award points if value is AT LEAST the threshold
      return value >= targetValue ? maxPoints : 0;
    }
  }

  if (scoringMode === 'scaled') {
    const target = threshold || 100;

    if (thresholdType === 'max') {
      // For max threshold: less is better, full points at 0, zero points at threshold
      if (value >= target) return 0;
      const percentage = 1 - (value / target);
      return Math.round(maxPoints * Math.max(0, Math.min(1, percentage)));
    } else {
      // For min threshold: more is better, full points at threshold or above
      const percentage = Math.min(value / target, 1);
      return Math.round(maxPoints * percentage);
    }
  }

  if (scoringMode === 'tiered' && tiers && tiers.length > 0) {
    if (thresholdType === 'max') {
      // Sort tiers by threshold ascending for max type
      const sortedTiers = [...tiers].sort((a, b) => a.threshold - b.threshold);

      // Find the highest tier the value meets (value <= threshold)
      for (const tier of sortedTiers) {
        if (value <= tier.threshold) {
          return tier.points;
        }
      }
    } else {
      // Sort tiers by threshold descending for min type
      const sortedTiers = [...tiers].sort((a, b) => b.threshold - a.threshold);

      // Find the highest tier the value meets (value >= threshold)
      for (const tier of sortedTiers) {
        if (value >= tier.threshold) {
          return tier.points;
        }
      }
    }

    return 0;
  }

  return 0;
}

/**
 * Calculate total points for a daily entry
 */
export function calculateDailyPoints(
  metrics: MetricWithScoring[],
  metricData: Record<string, any>
): {
  basePoints: number;
  breakdown: Record<string, number>;
  allRequiredComplete: boolean;
} {
  let basePoints = 0;
  const breakdown: Record<string, number> = {};
  let allRequiredComplete = true;

  for (const metric of metrics) {
    const value = metricData[metric.id];
    const points = calculateMetricPoints(metric, value);

    breakdown[metric.id] = points;
    basePoints += points;

    // Check if required metrics are complete
    if (metric.required && points === 0) {
      allRequiredComplete = false;
    }
  }

  return {
    basePoints,
    breakdown,
    allRequiredComplete,
  };
}

/**
 * Calculate bonus points based on challenge configuration
 */
export function calculateBonusPoints(
  challenge: {
    enable_streak_bonus?: boolean;
    streak_bonus_points?: number;
    enable_perfect_day_bonus?: boolean;
    perfect_day_bonus_points?: number;
  },
  currentStreak: number,
  allRequiredComplete: boolean
): {
  streakBonus: number;
  perfectDayBonus: number;
  totalBonus: number;
} {
  let streakBonus = 0;
  let perfectDayBonus = 0;

  if (challenge.enable_streak_bonus && currentStreak > 0) {
    streakBonus = (challenge.streak_bonus_points || 5) * currentStreak;
  }

  if (challenge.enable_perfect_day_bonus && allRequiredComplete) {
    perfectDayBonus = challenge.perfect_day_bonus_points || 10;
  }

  return {
    streakBonus,
    perfectDayBonus,
    totalBonus: streakBonus + perfectDayBonus,
  };
}

/**
 * Calculate total entry score (base + bonus)
 */
export function calculateEntryScore(
  metrics: MetricWithScoring[],
  metricData: Record<string, any>,
  challenge: {
    enable_streak_bonus?: boolean;
    streak_bonus_points?: number;
    enable_perfect_day_bonus?: boolean;
    perfect_day_bonus_points?: number;
  },
  currentStreak: number
): {
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
  breakdown: Record<string, number>;
} {
  const { basePoints, breakdown, allRequiredComplete } = calculateDailyPoints(metrics, metricData);
  const { totalBonus } = calculateBonusPoints(challenge, currentStreak, allRequiredComplete);

  return {
    basePoints,
    bonusPoints: totalBonus,
    totalPoints: basePoints + totalBonus,
    breakdown,
  };
}
