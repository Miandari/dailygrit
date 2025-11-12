'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { updateProfile } from '@/app/actions/profile';
import toast from 'react-hot-toast';
import { Loader2, User } from 'lucide-react';

interface ProfileInfoSectionProps {
  profile: {
    username: string | null;
    full_name: string | null;
    bio: string | null;
    avatar_url: string | null;
  } | null;
  userEmail: string;
}

export default function ProfileInfoSection({ profile, userEmail }: ProfileInfoSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    username: profile?.username || '',
    full_name: profile?.full_name || '',
    bio: profile?.bio || '',
    avatar_url: profile?.avatar_url || '',
  });

  const handleSave = async () => {
    setIsSaving(true);

    const result = await updateProfile(formData);

    if (result.success) {
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } else {
      toast.error(result.error || 'Failed to update profile');
    }

    setIsSaving(false);
  };

  const handleCancel = () => {
    setFormData({
      username: profile?.username || '',
      full_name: profile?.full_name || '',
      bio: profile?.bio || '',
      avatar_url: profile?.avatar_url || '',
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Profile Picture Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>Update your profile picture</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={formData.avatar_url || ''} alt={formData.username || 'User'} />
              <AvatarFallback>
                <User className="h-10 w-10" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <Label htmlFor="avatar_url">Avatar URL</Label>
                  <Input
                    id="avatar_url"
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={formData.avatar_url}
                    onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter a URL to your profile picture
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {formData.avatar_url ? 'Profile picture set' : 'No profile picture set'}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Information Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Your personal information and bio</CardDescription>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={userEmail}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed. Contact support if needed.
            </p>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">
              Username {isEditing && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="johndoe"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              disabled={!isEditing}
              className={!isEditing ? 'bg-muted' : ''}
            />
            {isEditing && (
              <p className="text-xs text-muted-foreground">
                3-20 characters, letters, numbers, underscores, and hyphens only
              </p>
            )}
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              type="text"
              placeholder="John Doe"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              disabled={!isEditing}
              className={!isEditing ? 'bg-muted' : ''}
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              disabled={!isEditing}
              className={!isEditing ? 'bg-muted' : ''}
              rows={4}
            />
            {isEditing && (
              <p className="text-xs text-muted-foreground">
                Brief description for your profile
              </p>
            )}
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
              <Button onClick={handleCancel} variant="outline" disabled={isSaving}>
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
