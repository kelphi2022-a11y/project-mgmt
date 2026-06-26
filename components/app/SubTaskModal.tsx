"use client";
import React, { useState } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';

interface SubTaskModalProps {
  taskId: string;
  onSubTaskCreated: () => void;
  children: React.ReactNode;
}

export default function SubTaskModal({ taskId, onSubTaskCreated, children }: SubTaskModalProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setTitle('');
  };

  const handleCreate = async () => {
    if (!title) return;
    setLoading(true);
    const { error } = await supabase.from('subtasks').insert([
      { title, task_id: taskId, completed: false },
    ]);
    setLoading(false);
    if (error) {
      console.error('Failed to create sub‑task', error);
    } else {
      reset();
      setOpen(false);
      onSubTaskCreated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Sub‑Task</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Sub‑task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading || !title}>
            {loading ? 'Creating…' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
