import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import UserManagement from '@/components/admin/UserManagement';
import DepartmentManagement from '@/components/admin/DepartmentManagement';
import LeaveTypeManagement from '@/components/admin/LeaveTypeManagement';
import AppSettings from '@/components/admin/AppSettings';

export default function AdminPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="leaveTypes">Leave Types</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
        <TabsContent value="departments">
          <DepartmentManagement />
        </TabsContent>
        <TabsContent value="leaveTypes">
          <LeaveTypeManagement />
        </TabsContent>
        <TabsContent value="settings">
          <AppSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
