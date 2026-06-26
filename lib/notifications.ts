// app/lib/notifications.ts

import { supabase } from '@/utils/supabase/client';

/** Notification type matching the Supabase table */
export interface Notification {
  id: string;
  user_id: string; // recipient user
  title: string;
  message: string;
  avatar_url?: string | null;
  read: boolean;
  created_at: string; // ISO timestamp
}

/** Create a new notification for a user */
export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  avatarUrl?: string
): Promise<Notification | null> => {
  const { data, error } = await supabase.from('notifications').insert([
    {
      user_id: userId,
      title,
      message,
      avatar_url: avatarUrl ?? null,
      read: false,
    },
  ]).select('*').single();
  if (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
  return data as Notification;
};

/** Mark a notification as read */
export const markNotificationRead = async (notificationId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);
  if (error) {
    console.error('Failed to mark notification read:', error);
    return false;
  }
  return true;
};

/** Fetch unread count for a user */
export const fetchUnreadCount = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);
  if (error) {
    console.error('Failed to fetch unread count:', error);
    return 0;
  }
  return count ?? 0;
};

/** Fetch recent notifications for a user */
export const fetchRecentNotifications = async (
  userId: string,
  limit = 20
): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('Failed to fetch notifications:', error);
    return [];
  }
  return data as Notification[];
};

export default { createNotification, markNotificationRead, fetchUnreadCount, fetchRecentNotifications };
