"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Task {
  id: string;
  title: string;
  project_name: string;
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, projects(name)")
        .eq("assignee_id", user.id);
      if (error) console.error(error);
      else if (data) {
        const formatted = (data as any[]).map(item => ({
          id: item.id,
          title: item.title,
          project_name: item.projects?.name ?? "",
        }));
        setTasks(formatted);
      }
      setLoading(false);
    };
    fetchTasks();
  }, []);

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
      <section>
        <h2 className="text-xl font-semibold mb-4 text-primary">My Tasks</h2>
        {loading ? (
          <p className="text-muted">Loading tasks…</p>
        ) : tasks.length === 0 ? (
          <p className="text-muted">No tasks assigned.</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map(task => (
              <li key={task.id} className="p-3 bg-card rounded-md shadow-sm">
                <Link href={`/tasks/${task.id}`} className="font-medium text-primary hover:underline">
                  {task.title}
                </Link>
                <p className="text-sm text-muted">Project: {task.project_name}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-4 text-primary">Upcoming (Next 7 Days)</h2>
        <p className="text-muted">[TODO] Merged timeline of tasks, follow‑ups, leaves.</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-4 text-primary">Team Today</h2>
        <p className="text-muted">[TODO] Who is out, meetings, leave status.</p>
      </section>
    </div>
  );
}
