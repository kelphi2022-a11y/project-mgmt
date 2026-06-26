"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Project {
  id: string;
  name: string;
  description?: string | null;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, description")
        .eq("id", id)
        .single();
      if (error) {
        console.error("Failed to load project", error);
      } else if (data) {
        setProject(data as Project);
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) {
    return <div className="p-4 text-muted">Loading project…</div>;
  }

  if (!project) {
    return <div className="p-4 text-destructive">Project not found.</div>;
  }

  return (
    <div className="p-4">
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-primary text-2xl">{project.name}</CardTitle>
        </CardHeader>
        <CardContent className="text-muted">
          {project.description ?? <p className="italic">No description provided.</p>}
        </CardContent>
      </Card>
      <div className="mt-6 flex space-x-4">
        <Link
          href={`/projects/${project.id}/sub-projects`}
          className="px-4 py-2 bg-accent text-accent-foreground rounded-md hover:bg-accent/90"
        >
          View Sub‑Projects
        </Link>
        <Link
          href="/projects"
          className="px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/90"
        >
          Back to Projects
        </Link>
      </div>
    </div>
  );
}
