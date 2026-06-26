// lib/actions/notes.ts
import { supabase } from '@/lib/supabase';

export type Note = {
  id: string;
  title: string;
  content: string;
  created_at?: string;
  project_id: string;
};

export async function getNotesByProject(projectId: string) {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('project_id', projectId);
  if (error) throw error;
  return data as Note[];
}

export async function createNote(note: Omit<Note, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('notes').insert([note]).select();
  if (error) throw error;
  return data[0] as Note;
}

export async function updateNote(id: string, updates: Partial<Omit<Note, 'id' | 'project_id'>>) {
  const { data, error } = await supabase
    .from('notes')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0] as Note;
}

export async function deleteNote(id: string) {
  const { error } = await supabase.from('notes').delete().eq('id', id);
  if (error) throw error;
  return true;
}
