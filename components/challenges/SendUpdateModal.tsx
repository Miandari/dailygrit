'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { sendChallengeUpdate } from '@/app/actions/sendChallengeUpdate'
import toast from 'react-hot-toast'
import { Loader2, Mail, Users } from 'lucide-react'

interface SendUpdateModalProps {
  challengeId: string
  challengeName: string
  participantCount: number
  isOpen: boolean
  onClose: () => void
}

export default function SendUpdateModal({
  challengeId,
  challengeName,
  participantCount,
  isOpen,
  onClose,
}: SendUpdateModalProps) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  const handleSend = async () => {
    // Validation
    if (!subject.trim()) {
      toast.error('Please enter a subject')
      return
    }

    if (!message.trim()) {
      toast.error('Please enter a message')
      return
    }

    if (subject.length > 200) {
      toast.error('Subject must be less than 200 characters')
      return
    }

    if (message.length > 5000) {
      toast.error('Message must be less than 5000 characters')
      return
    }

    setIsSending(true)

    try {
      const result = await sendChallengeUpdate(challengeId, subject, message)

      if (result.success) {
        toast.success(
          `Update sent successfully! ${result.emailCount} ${
            result.emailCount === 1 ? 'participant' : 'participants'
          } will receive your message.`
        )
        // Reset form
        setSubject('')
        setMessage('')
        onClose()
      } else {
        toast.error(result.error || 'Failed to send update')
      }
    } catch (error) {
      console.error('Error sending update:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsSending(false)
    }
  }

  const handleClose = () => {
    if (!isSending) {
      // Reset form on close
      setSubject('')
      setMessage('')
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Participants
          </DialogTitle>
          <DialogDescription>
            Send an update to all participants in <strong>{challengeName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Participant count info */}
          <div className="rounded-lg bg-muted p-3 flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              This will be sent to participants who have email notifications enabled.
              {participantCount > 0 && (
                <span className="font-medium text-foreground">
                  {' '}({participantCount} total participants)
                </span>
              )}
            </span>
          </div>

          {/* Subject field */}
          <div className="space-y-2">
            <Label htmlFor="subject">
              Subject <span className="text-destructive">*</span>
            </Label>
            <Input
              id="subject"
              type="text"
              placeholder="Enter email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isSending}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              {subject.length}/200 characters
            </p>
          </div>

          {/* Message field */}
          <div className="space-y-2">
            <Label htmlFor="message">
              Message <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="message"
              placeholder="Enter your message to participants..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSending}
              rows={8}
              maxLength={5000}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {message.length}/5000 characters
            </p>
          </div>

          {/* Note about unsubscribe */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3 text-sm text-blue-900 dark:text-blue-100">
            <p>
              <strong>Note:</strong> All emails include an unsubscribe link. Recipients can opt out
              of challenge updates at any time.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending || !subject.trim() || !message.trim()}>
            {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSending ? 'Sending...' : 'Send Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
