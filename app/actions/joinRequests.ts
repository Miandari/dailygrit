'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function submitJoinRequest(challengeId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // Check if challenge is private
    const { data: challenge } = await supabase
      .from('challenges')
      .select('is_public')
      .eq('id', challengeId)
      .single();

    if (!challenge) {
      return { success: false, error: 'Challenge not found' };
    }

    if (challenge.is_public) {
      return { success: false, error: 'This is a public challenge, you can join directly' };
    }

    // Check if user is already a participant
    const { data: existingParticipation } = await supabase
      .from('challenge_participants')
      .select('id')
      .eq('challenge_id', challengeId)
      .eq('user_id', user.id)
      .single();

    if (existingParticipation) {
      return { success: false, error: 'You are already a participant' };
    }

    // Create join request
    const { error: insertError } = await supabase
      .from('challenge_join_requests')
      .insert({
        challenge_id: challengeId,
        user_id: user.id,
        status: 'pending',
      });

    if (insertError) {
      // Check if it's a duplicate request error
      if (insertError.code === '23505') {
        return { success: false, error: 'You have already requested to join this challenge' };
      }
      console.error('Insert error:', insertError);
      return { success: false, error: insertError.message };
    }

    revalidatePath('/challenges/browse');
    return { success: true };
  } catch (error) {
    console.error('Error creating join request:', error);
    return { success: false, error: 'Failed to create join request' };
  }
}

export async function approveJoinRequest(requestId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // Get the join request
    const { data: joinRequest } = await supabase
      .from('challenge_join_requests')
      .select('challenge_id, user_id, status')
      .eq('id', requestId)
      .single();

    if (!joinRequest) {
      return { success: false, error: 'Join request not found' };
    }

    if (joinRequest.status !== 'pending') {
      return { success: false, error: 'This request has already been reviewed' };
    }

    // Verify user is the challenge creator
    const { data: challenge } = await supabase
      .from('challenges')
      .select('creator_id')
      .eq('id', joinRequest.challenge_id)
      .single();

    if (!challenge || challenge.creator_id !== user.id) {
      return { success: false, error: 'Only the challenge creator can approve requests' };
    }

    // Add user as participant using SECURITY DEFINER function to bypass RLS
    const { data: addResult, error: rpcError } = await supabase.rpc('add_approved_participant', {
      p_challenge_id: joinRequest.challenge_id,
      p_user_id: joinRequest.user_id,
    });

    if (rpcError) {
      console.error('Error calling add_approved_participant:', rpcError);
      return { success: false, error: `Failed to add participant: ${rpcError.message}` };
    }

    if (!addResult?.success) {
      console.error('Function returned error:', addResult);
      return { success: false, error: addResult?.error || 'Failed to add participant' };
    }

    // Update join request status
    const { error: updateError } = await supabase
      .from('challenge_join_requests')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating request:', updateError);
      return { success: false, error: 'Failed to update request status' };
    }

    revalidatePath('/challenges/requests');
    revalidatePath(`/challenges/${joinRequest.challenge_id}/participants`);
    revalidatePath(`/challenges/${joinRequest.challenge_id}/progress`);
    revalidatePath(`/challenges/${joinRequest.challenge_id}`);
    return { success: true };
  } catch (error) {
    console.error('Error approving join request:', error);
    return { success: false, error: 'Failed to approve join request' };
  }
}

export async function rejectJoinRequest(requestId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // Get the join request
    const { data: joinRequest } = await supabase
      .from('challenge_join_requests')
      .select('challenge_id, status')
      .eq('id', requestId)
      .single();

    if (!joinRequest) {
      return { success: false, error: 'Join request not found' };
    }

    if (joinRequest.status !== 'pending') {
      return { success: false, error: 'This request has already been reviewed' };
    }

    // Verify user is the challenge creator
    const { data: challenge } = await supabase
      .from('challenges')
      .select('creator_id')
      .eq('id', joinRequest.challenge_id)
      .single();

    if (!challenge || challenge.creator_id !== user.id) {
      return { success: false, error: 'Only the challenge creator can reject requests' };
    }

    // Update join request status
    const { error: updateError } = await supabase
      .from('challenge_join_requests')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating request:', updateError);
      return { success: false, error: 'Failed to update request status' };
    }

    revalidatePath('/challenges/requests');
    revalidatePath('/challenges/browse');
    return { success: true };
  } catch (error) {
    console.error('Error rejecting join request:', error);
    return { success: false, error: 'Failed to reject join request' };
  }
}
