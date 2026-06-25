import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

export interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export default function NoteCard({ note }: { note: Note }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg font-medium" title={note.title}>
          {note.title}
        </CardTitle>
        <p className="text-sm text-muted">
          {format(new Date(note.created_at), "PPP p")}
        </p>
      </CardHeader>
      <CardContent className="text-sm line-clamp-3 text-muted">
        {note.content}
      </CardContent>
    </Card>
  );
}
