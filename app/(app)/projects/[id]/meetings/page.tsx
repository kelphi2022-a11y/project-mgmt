"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import MeetingCard from '@/components/app/MeetingCard';
import MeetingForm from '@/components/app/MeetingForm';
import { Button } from '@/components/ui/button';

export default function ProjectMeetingsPage({ params }: { params: { id: string } }) {
  const projectId = params.id;
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchMeetings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('project_id', projectId);
    if (error) console.error('Error fetching meetings', error);
    else setMeetings(data as any[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchMeetings();
  }, [projectId]);

  const handleMeetingCreated = () => {
    fetchMeetings();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Project Meetings</h1>
        <MeetingForm projectId={projectId} onMeetingCreated={handleMeetingCreated}>
          <Button variant="default">New Meeting</Button>
        </MeetingForm>
      </div>
      {loading ? (
        <p>Loading meetings...</p>
      ) : meetings.length === 0 ? (
        <p>No meetings scheduled for this project.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {meetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      )}
    </div>
  );
}
