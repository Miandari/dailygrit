'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { format } from 'date-fns';
import { calculateEntryScore } from '@/lib/utils/scoring';

interface SaveEntryData {
  participantId: string;
  metricData: Record<string, any>;
  isCompleted: boolean;
  notes?: string;
}

export async function saveDailyEntry(data: SaveEntryData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // Verify the participation belongs to the user
    const { data: participation, error: participationError } = await supabase
      .from('challenge_participants')
      .select('id, challenge_id, user_id')
      .eq('id', data.participantId)
      .eq('user_id', user.id)
      .single() as any;

    if (participationError) {
      console.error('Error fetching participation:', participationError);
      return { success: false, error: `Participation not found: ${participationError.message}` };
    }

    if (!participation) {
      return { success: false, error: 'Invalid participation' };
    }

    // Get challenge with metrics and bonus configuration
    const { data: challenge } = await supabase
      .from('challenges')
      .select('lock_entries_after_day, metrics, enable_streak_bonus, streak_bonus_points, enable_perfect_day_bonus, perfect_day_bonus_points')
      .eq('id', participation.challenge_id)
      .single() as any;

    if (!challenge) {
      return { success: false, error: 'Challenge not found' };
    }

    // Get current streak for bonus calculation
    const { data: participantData } = await supabase
      .from('challenge_participants')
      .select('current_streak')
      .eq('id', data.participantId)
      .single() as any;

    const currentStreak = participantData?.current_streak || 0;

    const today = format(new Date(), 'yyyy-MM-dd');

    // Check if entry already exists
    const { data: existingEntry } = await supabase
      .from('daily_entries')
      .select('id, is_locked')
      .eq('participant_id', data.participantId)
      .eq('entry_date', today)
      .single() as any;

    if (existingEntry?.is_locked) {
      return { success: false, error: 'Entry is locked and cannot be modified' };
    }

    // Calculate points
    const scoring = calculateEntryScore(
      challenge.metrics || [],
      data.metricData,
      challenge,
      currentStreak
    );

    const entryData = {
      participant_id: data.participantId,
      entry_date: today,
      metric_data: data.metricData,
      is_completed: data.isCompleted,
      notes: data.notes || null,
      is_locked: challenge.lock_entries_after_day || false,
      points_earned: scoring.basePoints,
      bonus_points: scoring.bonusPoints,
      submitted_at: new Date().toISOString(),
    };

    if (existingEntry) {
      // Update existing entry
      // @ts-ignore
      const { error } = await supabase
        .from('daily_entries')
        .update(entryData as any)
        .eq('id', existingEntry.id);

      if (error) {
        console.error('Update error:', error);
        throw error;
      }
    } else {
      // Create new entry
      // @ts-ignore
      const { error } = await supabase
        .from('daily_entries')
        .insert(entryData as any);

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }
    }

    // Update streak if completed
    if (data.isCompleted) {
      await updateStreak(participation.id);
    }

    // Update participant's total points
    await updateTotalPoints(participation.id);

    revalidatePath('/dashboard/today');
    revalidatePath('/dashboard');
    revalidatePath(`/challenges/${participation.challenge_id}`);
    revalidatePath(`/challenges/${participation.challenge_id}/progress`);

    return { success: true };
  } catch (error) {
    console.error('Error saving daily entry:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to save entry' };
  }
}

async function updateStreak(participantId: string) {
  const supabase = await createClient();

  try {
    // Get all entries for this participant, ordered by date
    const { data: entries } = await supabase
      .from('daily_entries')
      .select('entry_date, is_completed')
      .eq('participant_id', participantId)
      .eq('is_completed', true)
      .order('entry_date', { ascending: false });

    if (!entries || entries.length === 0) {
      return;
    }

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < entries.length; i++) {
      const entryDate = new Date(entries[i].entry_date);
      entryDate.setHours(0, 0, 0, 0);

      const dayDiff = Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));

      if (dayDiff === i) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Get current longest streak
    const { data: participant } = await supabase
      .from('challenge_participants')
      .select('longest_streak')
      .eq('id', participantId)
      .single() as any;

    const longestStreak = Math.max(currentStreak, participant?.longest_streak || 0);

    // Update streaks
    await supabase
      .from('challenge_participants')
      .update({
        current_streak: currentStreak,
        longest_streak: longestStreak,
      })
      .eq('id', participantId);
  } catch (error) {
    console.error('Error updating streak:', error);
  }
}

async function updateTotalPoints(participantId: string) {
  const supabase = await createClient();

  try {
    // Sum all points from daily entries for this participant
    const { data: entries } = await supabase
      .from('daily_entries')
      .select('points_earned, bonus_points')
      .eq('participant_id', participantId);

    if (!entries) {
      return;
    }

    const totalPoints = entries.reduce((sum, entry) => {
      return sum + (entry.points_earned || 0) + (entry.bonus_points || 0);
    }, 0);

    // Update participant's total points
    await supabase
      .from('challenge_participants')
      .update({ total_points: totalPoints })
      .eq('id', participantId);
  } catch (error) {
    console.error('Error updating total points:', error);
  }
}

export async function getDailyEntries(challengeId: string, date?: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const targetDate = date || format(new Date(), 'yyyy-MM-dd');

  try {
    // Get user's participation
    const { data: participation } = await supabase
      .from('challenge_participants')
      .select('id')
      .eq('challenge_id', challengeId)
      .eq('user_id', user.id)
      .single() as any;

    if (!participation) {
      return { success: false, error: 'Not participating in this challenge' };
    }

    // Get entries for the date
    const { data: entries, error } = await supabase
      .from('daily_entries')
      .select('*')
      .eq('participant_id', participation.id)
      .eq('entry_date', targetDate)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, entries };
  } catch (error) {
    console.error('Error fetching entries:', error);
    return { success: false, error: 'Failed to fetch entries' };
  }
}