import React, { useState } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/app/lib/supabase';

interface LeaveRequestModalProps {
  userId: string;
  onLeaveCreated: () => void;
  children: React.ReactNode;
}

export default function LeaveRequestModal({ userId, onLeaveCreated, children }: LeaveRequestModalProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setTitle('');
    setStart('');
    setEnd('');
  };

  const handleCreate = async () => {
    if (!title || !start || !end) return;
    setLoading(true);
    const { error } = await supabase.from('calendar_events').insert([
      {
        title,
        start,
        end,
        type: 'leave',
        user_id: userId,
      },
    ]);
    setLoading(false);
    if (error) {
      console.error('Failed to create leave request', error);
    } else {
      reset();
      setOpen(false);
      onLeaveCreated();
    };
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Leave Request</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleCreate} disabled={loading || !title || !start || !end}>
            {loading ? 'Creating…' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
