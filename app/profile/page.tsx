import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProfileInfoSection from '@/components/profile/ProfileInfoSection';
import ProfileSettingsSection from '@/components/profile/ProfileSettingsSection';

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const defaultTab = params.tab === 'settings' ? 'settings' : 'info';

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user profile with all fields
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      id,
      username,
      full_name,
      avatar_url,
      bio,
      website_url,
      twitter_handle,
      github_handle,
      instagram_handle,
      location,
      public_profile_url,
      last_active_at,
      created_at,
      updated_at
    `)
    .eq('id', user.id)
    .single();

  // Fetch user preferences (create if doesn't exist)
  let { data: preferences } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // If no preferences exist, create default ones
  if (!preferences) {
    const { data: newPreferences } = await supabase
      .from('user_preferences')
      .insert({ user_id: user.id })
      .select()
      .single();

    preferences = newPreferences;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Profile</h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Manage your account information and preferences
          </p>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="info">Basic Info</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="info">
            <ProfileInfoSection
              profile={profile}
              userEmail={user.email || ''}
            />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <ProfileSettingsSection
              preferences={preferences}
            />
          </TabsContent>
        </Tabs>

        {/* Expandable sections placeholder */}
        {/* Future sections can be added here as new TabsTrigger and TabsContent */}
        {/* Examples: Security, Privacy, Integrations, etc. */}
      </div>
    </div>
  );
}
