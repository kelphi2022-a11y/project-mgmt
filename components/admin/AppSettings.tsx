"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchSettings, upsertSetting } from '@/lib/actions/admin';
import { Table, TableHeader, TableRow, TableCell, TableBody } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function AppSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editKey, setEditKey] = useState('');
  const [editValue, setEditValue] = useState('');
  const [isNew, setIsNew] = useState(true);

  const loadSettings = async () => {
    try {
      const data = await fetchSettings();
      const map: Record<string, string> = {};
      data?.forEach((s: any) => {
        map[s.key] = s.value;
      });
      setSettings(map);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const openCreate = () => {
    setIsNew(true);
    setEditKey('');
    setEditValue('');
    setDialogOpen(true);
  };

  const openEdit = (key: string, value: string) => {
    setIsNew(false);
    setEditKey(key);
    setEditValue(value);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    await upsertSetting({ key: editKey, value: editValue });
    setDialogOpen(false);
    loadSettings();
  };

  const handleDelete = async (key: string) => {
    await upsertSetting({ key, value: '' }); // Simple way to clear; backend may support delete.
    loadSettings();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Application Settings</h2>
        <Button onClick={openCreate}>Add Setting</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>Key</TableCell>
            <TableCell>Value</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(settings).map(([key, value]) => (
            <TableRow key={key}>
              <TableCell>{key}</TableCell>
              <TableCell>{value}</TableCell>
              <TableCell className="space-x-2">
                <Button variant="secondary" size="sm" onClick={() => openEdit(key, value)}>
                  Edit
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleDelete(key)}>
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <span /> {/* placeholder */}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isNew ? 'Create Setting' : 'Edit Setting'}</DialogTitle>
          </DialogHeader>
          <Input placeholder="Key" value={editKey} onChange={(e) => setEditKey(e.target.value)} className="mt-2" disabled={!isNew} />
          <Input placeholder="Value" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="mt-2" />
          <DialogFooter>
            <Button onClick={handleSave}>{isNew ? 'Create' : 'Update'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
