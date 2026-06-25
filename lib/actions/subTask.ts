import { supabase } from '@/app/lib/supabase';

export type SubTask = {
  id: string;
  title: string;
  completed: boolean;
  task_id: string;
};

/** Create a new sub‑task */
export async function createSubTask(subTask: Omit<SubTask, 'id'>) {
  const { data, error } = await supabase.from('subtasks').insert(subTask).select();
  if (error) throw error;
  return data[0] as SubTask;
}

/** Update an existing sub‑task */
export async function updateSubTask(id: string, updates: Partial<Omit<SubTask, 'id'>>) {
  const { data, error } = await supabase
    .from('subtasks')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0] as SubTask;
}

/** Delete a sub‑task */
export async function deleteSubTask(id: string) {
  const { error } = await supabase.from('subtasks').delete().eq('id', id);
  if (error) throw error;
  return true;
}

/** Get sub‑tasks for a specific task */
export async function getSubTasksByTask(taskId: string) {
  const { data, error } = await supabase
    .from('subtasks')
    .select('*')
    .eq('task_id', taskId);
  if (error) throw error;
  return data as SubTask[];
}
