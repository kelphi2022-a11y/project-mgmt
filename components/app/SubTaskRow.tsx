import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/lib/supabase';
import { SubTask } from '@/lib/actions/subTask';

interface SubTaskRowProps {
  subTask: SubTask;
  onUpdate: () => void;
}

export default function SubTaskRow({ subTask, onUpdate }: SubTaskRowProps) {
  const toggleComplete = async () => {
    await supabase
      .from('subtasks')
      .update({ completed: !subTask.completed })
      .eq('id', subTask.id);
    onUpdate();
  };

  return (
    <div className="flex items-center space-x-2 py-1">
      <Checkbox checked={subTask.completed} onCheckedChange={toggleComplete} />
      <span className={subTask.completed ? 'line-through text-muted' : ''}>
        {subTask.title}
      </span>
    </div>
  );
}
