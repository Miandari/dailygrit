'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: 'Unauthorized' };
  }

  const file = formData.get('avatar') as File;

  if (!file) {
    return { error: 'No file provided' };
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' };
  }

  // Validate file size (2MB max)
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSize) {
    return { error: 'File too large. Maximum size is 2MB.' };
  }

  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/avatar.${fileExt}`;

    // Delete old avatar if exists
    const { data: existingFiles } = await supabase.storage
      .from('avatars')
      .list(user.id);

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map((x) => `${user.id}/${x.name}`);
      await supabase.storage.from('avatars').remove(filesToDelete);
    }

    // Upload new avatar
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { error: 'Failed to upload avatar' };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(fileName);

    // Update profile with new avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return { error: 'Failed to update profile' };
    }

    // Revalidate profile page
    revalidatePath('/profile');
    revalidatePath(`/profile/${user.id}`);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Avatar upload error:', error);
    return { error: 'An unexpected error occurred' };
  }
}

export async function deleteAvatar() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: 'Unauthorized' };
  }

  try {
    // Delete all files in user's avatar folder
    const { data: existingFiles } = await supabase.storage
      .from('avatars')
      .list(user.id);

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map((x) => `${user.id}/${x.name}`);
      await supabase.storage.from('avatars').remove(filesToDelete);
    }

    // Remove avatar URL from profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', user.id);

    if (updateError) {
      return { error: 'Failed to update profile' };
    }

    // Revalidate profile page
    revalidatePath('/profile');
    revalidatePath(`/profile/${user.id}`);

    return { success: true };
  } catch (error) {
    console.error('Avatar delete error:', error);
    return { error: 'An unexpected error occurred' };
  }
}
