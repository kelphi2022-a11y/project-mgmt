import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export interface Task {
  id: string;
  title: string;
  status?: string;
  due_date?: string;
  priority?: string;
  assignee?: {
    id: string;
    email?: string;
    user_metadata?: { avatar_url?: string };
  };
}

export default function TaskCard({ task }: { task: Task }) {
  return (
    <Link href={`/tasks/${task.id}`} className="block">
      <Card className="hover:shadow-lg transition-shadow bg-card text-primary">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium truncate" title={task.title}>
            {task.title}
          </CardTitle>
          {task.priority && (
            <Badge variant="secondary" className="ml-2 capitalize">
              {task.priority}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          {task.assignee && (
            <div className="flex items-center space-x-2">
              <Avatar className="h-6 w-6">
                <AvatarImage
                  src={task.assignee.user_metadata?.avatar_url}
                  alt={task.assignee.email}
                />
                <AvatarFallback>
                  {task.assignee.email?.[0]?.toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted">{task.assignee.email}</span>
            </div>
          )}
          {task.due_date && (
            <p className="text-sm text-muted">Due: {new Date(task.due_date).toLocaleDateString()}</p>
          )}
          {task.status && (
            <p className="text-sm text-muted capitalize">Status: {task.status}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
