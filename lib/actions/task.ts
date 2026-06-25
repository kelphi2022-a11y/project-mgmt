// lib/actions/task.ts
import { supabase } from '@/app/lib/supabase';

export async function getTasksByProject(projectId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId);
  if (error) throw error;
  return data;
}

export async function createTask(task: {
  title: string;
  project_id: string;
  priority?: string | null;
  due_date?: string | null;
}) {
  const { error } = await supabase.from('tasks').insert([task]);
  if (error) throw error;
}

export async function updateTask(
  taskId: string,
  updates: Partial<{ title: string; priority: string; due_date: string }>
) {
  const { error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId);
  if (error) throw error;
}

export async function deleteTask(taskId: string) {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  if (error) throw error;
}
