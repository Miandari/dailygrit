import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Mail, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface UnsubscribePageProps {
  params: {
    token: string
  }
}

export default async function UnsubscribePage({ params }: UnsubscribePageProps) {
  const supabase = await createClient()

  // Process unsubscribe using the database function
  const { data, error } = await supabase.rpc('process_unsubscribe', {
    p_token: params.token,
  })

  // Check if there's a result
  const result = data && data.length > 0 ? data[0] : null

  if (error || !result || !result.success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Invalid Unsubscribe Link</CardTitle>
            <CardDescription>
              This unsubscribe link is invalid, expired, or has already been used.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              If you continue to receive unwanted emails, please visit your profile settings to
              manage your email preferences.
            </p>
            <div className="flex gap-2">
              <Button asChild variant="outline" className="flex-1">
                <Link href="/">
                  <span>Go to Homepage</span>
                </Link>
              </Button>
              <Button asChild className="flex-1">
                <Link href="/profile?tab=settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Email Settings</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Determine what was unsubscribed
  const emailTypeLabels: Record<string, string> = {
    daily_reminder: 'daily reminder',
    weekly_summary: 'weekly summary',
    join_request: 'join request notification',
    challenge_update: 'challenge update',
    all: 'all',
  }

  const unsubscribedType = result.email_type ? emailTypeLabels[result.email_type] || result.email_type : 'all'
  const isAllEmails = result.email_type === 'all' || !result.email_type

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-2">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle>Successfully Unsubscribed</CardTitle>
          </div>
          <CardDescription>
            {isAllEmails
              ? 'You have been unsubscribed from all Gritful emails.'
              : `You have been unsubscribed from ${unsubscribedType} emails.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex items-start gap-2">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">What this means</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isAllEmails
                    ? 'You will no longer receive any email notifications from Gritful.'
                    : `You will no longer receive ${unsubscribedType} emails from Gritful.`}
                </p>
              </div>
            </div>
          </div>

          {!isAllEmails && (
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4 space-y-2">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                You can still receive other types of email notifications. To manage all your email
                preferences, visit your profile settings.
              </p>
            </div>
          )}

          <div className="space-y-2 pt-2">
            <Button asChild className="w-full">
              <Link href="/profile?tab=settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Manage Email Preferences</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">
                <span>Go to Dashboard</span>
              </Link>
            </Button>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Changed your mind?{' '}
              <Link href="/profile?tab=settings" className="text-primary hover:underline">
                Update your preferences
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
