'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function removeParticipant(participantId: string, challengeId: string) {
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
      .select('creator_id')
      .eq('id', challengeId)
      .single();

    if (!challenge) {
      return { success: false, error: 'Challenge not found' };
    }

    if (challenge.creator_id !== user.id) {
      return { success: false, error: 'Only the challenge creator can remove participants' };
    }

    // Verify participant belongs to this challenge
    const { data: participant } = await supabase
      .from('challenge_participants')
      .select('user_id')
      .eq('id', participantId)
      .eq('challenge_id', challengeId)
      .single();

    if (!participant) {
      return { success: false, error: 'Participant not found in this challenge' };
    }

    // Don't allow removing the creator
    if (participant.user_id === challenge.creator_id) {
      return { success: false, error: 'Cannot remove the challenge creator' };
    }

    // Delete participant (cascade will handle entries)
    const { error: deleteError } = await supabase
      .from('challenge_participants')
      .delete()
      .eq('id', participantId);

    if (deleteError) {
      console.error('Error removing participant:', deleteError);
      return { success: false, error: 'Failed to remove participant' };
    }

    revalidatePath(`/challenges/${challengeId}/participants`);
    revalidatePath(`/challenges/${challengeId}/progress`);
    return { success: true };
  } catch (error) {
    console.error('Error removing participant:', error);
    return { success: false, error: 'Failed to remove participant' };
  }
}
