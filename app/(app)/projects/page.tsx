import React, { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import Link from "next/link";
import ProjectCard from "@/components/app/ProjectCard";

interface Project {
  id: string;
  name: string;
  description?: string | null;
}

export default function ProjectsPage() {
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
    return <div className="p-4 text-muted">Loading projects...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6 text-primary">Projects</h1>
      {projects.length === 0 ? (
        <p className="text-muted">No projects available.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((proj) => (
            <ProjectCard key={proj.id} project={proj} />
          ))}
        </div>
      )}
    </div>
  );
}
