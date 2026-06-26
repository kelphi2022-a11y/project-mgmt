"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchLeaveTypes, upsertLeaveType, deleteLeaveType } from '@/lib/actions/admin';
import { Table, TableHeader, TableRow, TableCell, TableBody } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function LeaveTypeManagement() {
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [typeName, setTypeName] = useState('');
  const [typeDays, setTypeDays] = useState('');
  const [editId, setEditId] = useState<string | null>(null);

  const loadLeaveTypes = async () => {
    setLoading(true);
    try {
      const data = await fetchLeaveTypes();
      setLeaveTypes(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaveTypes();
  }, []);

  const openCreate = () => {
    setEditId(null);
    setTypeName('');
    setTypeDays('');
    setDialogOpen(true);
  };

  const openEdit = (type: any) => {
    setEditId(type.id);
    setTypeName(type.name);
    setTypeDays(String(type.days));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    await upsertLeaveType({ id: editId ?? undefined, name: typeName, days: Number(typeDays) });
    setDialogOpen(false);
    loadLeaveTypes();
  };

  const handleDelete = async (id: string) => {
    await deleteLeaveType(id);
    loadLeaveTypes();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Leave Types</h2>
        <Button onClick={openCreate}>Add Leave Type</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Days</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaveTypes.map((lt) => (
            <TableRow key={lt.id}>
              <TableCell>{lt.name}</TableCell>
              <TableCell>{lt.days}</TableCell>
              <TableCell className="space-x-2">
                <Button variant="secondary" size="sm" onClick={() => openEdit(lt)}>
                  Edit
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleDelete(lt.id)}>
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
            <DialogTitle>{editId ? 'Edit Leave Type' : 'Create Leave Type'}</DialogTitle>
          </DialogHeader>
          <Input placeholder="Name" value={typeName} onChange={(e) => setTypeName(e.target.value)} className="mt-2" />
          <Input placeholder="Days" type="number" value={typeDays} onChange={(e) => setTypeDays(e.target.value)} className="mt-2" />
          <DialogFooter>
            <Button onClick={handleSave}>{editId ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
