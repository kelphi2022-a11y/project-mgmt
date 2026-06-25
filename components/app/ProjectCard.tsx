import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface Project {
  id: string;
  name: string;
  description?: string | null;
}

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.id}`} className="block">
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle>{project.name}</CardTitle>
          {project.description && (
            <CardDescription className="text-muted line-clamp-2">
              {project.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="text-sm text-muted">ID: {project.id}</CardContent>
      </Card>
    </Link>
  );
}
