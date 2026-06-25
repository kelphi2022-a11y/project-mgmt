import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import TaskCard, { Task } from '@/components/app/TaskCard';
import TaskModal from '@/components/app/TaskModal';
import { Button } from '@/components/ui/button';

export default function ProjectTasksPage({ params }: { params: { id: string } }) {
  const projectId = params.id;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId);
    if (error) {
      console.error('Error fetching tasks', error);
    } else {
      setTasks(data as Task[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const handleTaskCreated = () => {
    // Refresh list after a new task is created
    fetchTasks();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Project Tasks</h1>
        <TaskModal projectId={projectId} onTaskCreated={handleTaskCreated}>
          <Button variant="primary">New Task</Button>
        </TaskModal>
      </div>
      {loading ? (
        <p>Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <p>No tasks found for this project.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
