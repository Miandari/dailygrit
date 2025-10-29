'use server';

import { createClient } from '@/lib/supabase/server';
import { calculateEntryScore } from '@/lib/utils/scoring';
import { revalidatePath } from 'next/cache';

export async function recalculateAllPoints(challengeId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // Verify user is the challenge creator
    const { data: challenge } = await supabase
      .from('challenges')
      .select('creator_id, metrics, enable_streak_bonus, streak_bonus_points, enable_perfect_day_bonus, perfect_day_bonus_points')
      .eq('id', challengeId)
      .single() as any;

    if (!challenge) {
      return { success: false, error: 'Challenge not found' };
    }

    if (challenge.creator_id !== user.id) {
      return { success: false, error: 'Only the challenge creator can recalculate points' };
    }

    // Get all participants for this challenge
    const { data: participants } = await supabase
      .from('challenge_participants')
      .select('id, current_streak')
      .eq('challenge_id', challengeId);

    if (!participants || participants.length === 0) {
      return { success: true, recalculated: 0 };
    }

    let totalRecalculated = 0;

    // For each participant, recalculate all their entries
    for (const participant of participants) {
      const { data: entries } = await supabase
        .from('daily_entries')
        .select('id, metric_data, entry_date')
        .eq('participant_id', participant.id)
        .order('entry_date', { ascending: true });

      if (!entries || entries.length === 0) continue;

      // Recalculate points for each entry
      for (const entry of entries) {
        const scoring = calculateEntryScore(
          challenge.metrics || [],
          entry.metric_data,
          challenge,
          participant.current_streak
        );

        await supabase
          .from('daily_entries')
          .update({
            points_earned: scoring.basePoints,
            bonus_points: scoring.bonusPoints,
          })
          .eq('id', entry.id);

        totalRecalculated++;
      }

      // Update participant's total points
      const { data: allEntries } = await supabase
        .from('daily_entries')
        .select('points_earned, bonus_points')
        .eq('participant_id', participant.id);

      const totalPoints = (allEntries || []).reduce((sum, e) => {
        return sum + (e.points_earned || 0) + (e.bonus_points || 0);
      }, 0);

      await supabase
        .from('challenge_participants')
        .update({ total_points: totalPoints })
        .eq('id', participant.id);
    }

    revalidatePath(`/challenges/${challengeId}`);
    revalidatePath(`/challenges/${challengeId}/progress`);

    return { success: true, recalculated: totalRecalculated };
  } catch (error) {
    console.error('Error recalculating points:', error);
    return { success: false, error: 'Failed to recalculate points' };
  }
}
