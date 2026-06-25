import { supabase } from '@/app/lib/supabase';

export type CalendarEvent = {
  id: string;
  title: string;
  start: string; // ISO string
  end: string; // ISO string
  type: 'leave' | 'meeting';
};

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*');
  if (error) {
    console.error('Error fetching calendar events', error);
    return [];
  }
  return data as CalendarEvent[];
}

export async function createLeaveRequest(params: {
  user_id: string;
  title: string;
  start: string;
  end: string;
}) {
  const { error } = await supabase.from('calendar_events').insert([
    {
      ...params,
      type: 'leave',
    },
  ]);
  return { error };
}

export async function createMeetingEvent(params: {
  title: string;
  start: string;
  end: string;
  participants?: string[]; // user ids
}) {
  const { error } = await supabase.from('calendar_events').insert([
    {
      ...params,
      type: 'meeting',
    },
  ]);
  return { error };
}
