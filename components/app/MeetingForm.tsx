import React, { useState } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/app/lib/supabase';

interface MeetingFormProps {
  projectId: string;
  onMeetingCreated: () => void;
  children: React.ReactNode;
}

export default function MeetingForm({ projectId, onMeetingCreated, children }: MeetingFormProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [agenda, setAgenda] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setTitle('');
    setAgenda('');
    setDateTime('');
  };

  const handleCreate = async () => {
    if (!title || !dateTime) return;
    setLoading(true);
    const { error } = await supabase.from('meetings').insert([
      {
        title,
        agenda: agenda || null,
        scheduled_at: dateTime,
        project_id: projectId,
      },
    ]);
    setLoading(false);
    if (error) {
      console.error('Failed to create meeting', error);
    } else {
      reset();
      setOpen(false);
      onMeetingCreated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Meeting</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <Input
            placeholder="Meeting title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
          />
          <Textarea
            placeholder="Agenda (optional)"
            value={agenda}
            onChange={(e) => setAgenda(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading || !title || !dateTime}>
            {loading ? 'Creating…' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
