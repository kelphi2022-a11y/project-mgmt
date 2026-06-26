"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchDepartments, upsertDepartment, deleteDepartment } from '@/lib/actions/admin';
import { Table, TableHeader, TableRow, TableCell, TableBody } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const data = await fetchDepartments();
      setDepartments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const openCreate = () => {
    setEditId(null);
    setDeptName('');
    setDialogOpen(true);
  };

  const openEdit = (dept: any) => {
    setEditId(dept.id);
    setDeptName(dept.name);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    await upsertDepartment({ id: editId ?? undefined, name: deptName });
    setDialogOpen(false);
    loadDepartments();
  };

  const handleDelete = async (id: string) => {
    await deleteDepartment(id);
    loadDepartments();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Departments</h2>
        <Button onClick={openCreate}>Add Department</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {departments.map((d) => (
            <TableRow key={d.id}>
              <TableCell>{d.name}</TableCell>
              <TableCell className="space-x-2">
                <Button variant="secondary" size="sm" onClick={() => openEdit(d)}>
                  Edit
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleDelete(d.id)}>
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <span /> {/* placeholder, trigger handled above */}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Department' : 'Create Department'}</DialogTitle>
          </DialogHeader>
          <Input placeholder="Department name" value={deptName} onChange={(e) => setDeptName(e.target.value)} className="mt-2" />
          <DialogFooter>
            <Button onClick={handleSave}>{editId ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
