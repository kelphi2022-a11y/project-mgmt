import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/app/lib/supabase';
import type { Notification } from '@/app/lib/notifications';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  // Initial fetch
  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (!error && data) setNotifications(data as Notification[]);
    };
    fetch();
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
        const newNotif = payload.new as Notification;
        setNotifications((prev) => [newNotif, ...prev].slice(0, 20));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <Button variant="ghost" onClick={() => setOpen(!open)}>
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-xs text-white">
            {unreadCount}
          </span>
        )}
      </Button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-md bg-background shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="p-4">
            <h4 className="font-medium mb-2">Notifications</h4>
            {notifications.length === 0 ? (
              <p className="text-sm text-muted">No notifications</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <li key={n.id} className="flex items-center space-x-2">
                    {n.avatar_url && (
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={n.avatar_url} alt="avatar" />
                        <AvatarFallback>{n.title?.[0] ?? 'N'}</AvatarFallback>
                      </Avatar>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-muted">{n.message}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
