// lib/actions/meetings.ts
import { supabase } from '@/lib/supabase';

export type Meeting = {
  id: string;
  title: string;
  scheduled_at: string; // ISO string
  agenda?: string;
  project_id: string;
};

export async function getMeetingsByProject(projectId: string) {
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('project_id', projectId);
  if (error) throw error;
  return data as Meeting[];
}

export async function getMeeting(id: string) {
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Meeting;
}

export async function createMeeting(meeting: Omit<Meeting, 'id'>) {
  const { data, error } = await supabase.from('meetings').insert([meeting]).select();
  if (error) throw error;
  return data[0] as Meeting;
}

export async function updateMeeting(id: string, updates: Partial<Omit<Meeting, 'id' | 'project_id'>>) {
  const { data, error } = await supabase
    .from('meetings')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0] as Meeting;
}

export async function deleteMeeting(id: string) {
  const { error } = await supabase.from('meetings').delete().eq('id', id);
  if (error) throw error;
  return true;
}
