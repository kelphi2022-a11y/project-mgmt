"use client";
// app/(app)/projects/[id]/tasks/[taskId]/sub-tasks/page.tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SubTask } from '@/lib/actions/subTask';
import SubTaskRow from '@/components/app/SubTaskRow';
import SubTaskModal from '@/components/app/SubTaskModal';
import { Button } from '@/components/ui/button';

export default function SubTasksPage({ params }: { params: { id: string; taskId: string } }) {
  const { id: projectId, taskId } = params;
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchSubTasks = async () => {
    setLoading(true);
    const { data, error } = await fetch('/api/subtasks?taskId=' + taskId).then((res) => res.json());
    // For simplicity we use a direct Supabase call (the API route mirrors this)
    // In a real app replace with proper fetch
    if (!error) setSubTasks(data as SubTask[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchSubTasks();
  }, [taskId]);

  const handleUpdated = () => {
    fetchSubTasks();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Sub‑tasks</h2>
        <SubTaskModal taskId={taskId} onSubTaskCreated={handleUpdated}>
          <Button variant="default">Add Sub‑Task</Button>
        </SubTaskModal>
      </div>
      {loading ? (
        <p>Loading sub‑tasks...</p>
      ) : subTasks.length === 0 ? (
        <p>No sub‑tasks yet.</p>
      ) : (
        <div className="space-y-2">
          {subTasks.map((st) => (
            <SubTaskRow key={st.id} subTask={st} onUpdate={handleUpdated} />
          ))}
        </div>
      )}
    </div>
  );
}
