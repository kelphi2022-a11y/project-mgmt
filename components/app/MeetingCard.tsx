import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

export interface Meeting {
  id: string;
  title: string;
  scheduled_at: string;
  agenda?: string;
}

export default function MeetingCard({ meeting }: { meeting: Meeting }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg font-medium" title={meeting.title}>
          {meeting.title}
        </CardTitle>
        <p className="text-sm text-muted">
          {format(new Date(meeting.scheduled_at), "PPP p")}
        </p>
      </CardHeader>
      {meeting.agenda && (
        <CardContent className="text-sm line-clamp-2 text-muted">
          {meeting.agenda}
        </CardContent>
      )}
    </Card>
  );
}
