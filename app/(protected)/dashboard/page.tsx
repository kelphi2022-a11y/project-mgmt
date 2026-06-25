import React, { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  description: string | null;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      const { data, error } = await supabase.from("projects").select("id, name, description");
      if (error) {
        console.error("Error fetching projects:", error);
      } else if (data) {
        setProjects(data as Project[]);
      }
      setLoading(false);
    };
    fetchProjects();
  }, []);

  if (loading) {
    return <div className="p-4">Loading projects...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 text-primary">Dashboard</h1>
      {projects.length === 0 ? (
        <p className="text-muted">No projects found. Create one in the Projects page.</p>
      ) : (
        <ul className="space-y-2">
          {projects.map((proj) => (
            <li key={proj.id} className="p-4 bg-card rounded-md shadow-sm">
              <Link href={`/projects/${proj.id}`} className="text-lg font-medium text-primary hover:underline">
                {proj.name}
              </Link>
              {proj.description && <p className="text-muted mt-1">{proj.description}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
