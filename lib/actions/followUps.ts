// lib/actions/followUps.ts
import { supabase } from '@/app/lib/supabase';

export type FollowUp = {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'escalated';
  due_date?: string;
  project_id: string;
};

export async function getFollowUps() {
  const { data, error } = await supabase.from('follow_ups').select('*');
  if (error) throw error;
  return data as FollowUp[];
}

export async function createFollowUp(fup: Omit<FollowUp, 'id'>) {
  const { data, error } = await supabase.from('follow_ups').insert([fup]).select();
  if (error) throw error;
  return data[0] as FollowUp;
}

export async function updateFollowUp(id: string, updates: Partial<Omit<FollowUp, 'id' | 'project_id'>>) {
  const { data, error } = await supabase
    .from('follow_ups')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0] as FollowUp;
}

export async function deleteFollowUp(id: string) {
  const { error } = await supabase.from('follow_ups').delete().eq('id', id);
  if (error) throw error;
  return true;
}
