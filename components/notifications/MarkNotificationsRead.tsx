'use client';

import { useEffect } from 'react';
import { markAllNotificationsAsRead } from '@/app/actions/notifications';

/**
 * Component that automatically marks all notifications as read when mounted
 * Should be placed on the notifications viewing page
 */
export default function MarkNotificationsRead() {
  useEffect(() => {
    // Mark all notifications as read when this component mounts
    const markAsRead = async () => {
      await markAllNotificationsAsRead();
    };

    markAsRead();
  }, []); // Empty dependency array means this runs once on mount

  // This component doesn't render anything
  return null;
}
