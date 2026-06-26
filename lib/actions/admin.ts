import { supabase } from '@/lib/supabase';

// Users
export const fetchUsers = async () => {
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw error;
  return data;
};

export const updateUserRole = async (userId: string, role: string) => {
  const { error } = await supabase.from('users').update({ role }).eq('id', userId);
  if (error) throw error;
};

export const deactivateUser = async (userId: string) => {
  const { error } = await supabase.from('users').update({ is_active: false }).eq('id', userId);
  if (error) throw error;
};

export const inviteUser = async (email: string, role: string) => {
  // Supabase auth admin invite (requires service_role key)
  const { error } = await supabase.auth.admin.inviteUserByEmail(email, { data: { role } });
  if (error) throw error;
};

// Departments
export const fetchDepartments = async () => {
  const { data, error } = await supabase.from('departments').select('*');
  if (error) throw error;
  return data;
};

export const upsertDepartment = async (dept: { id?: string; name: string }) => {
  const { error } = await supabase.from('departments').upsert(dept);
  if (error) throw error;
};

export const deleteDepartment = async (deptId: string) => {
  const { error } = await supabase.from('departments').delete().eq('id', deptId);
  if (error) throw error;
};

// Leave Types
export const fetchLeaveTypes = async () => {
  const { data, error } = await supabase.from('leave_types').select('*');
  if (error) throw error;
  return data;
};

export const upsertLeaveType = async (type: { id?: string; name: string; days: number }) => {
  const { error } = await supabase.from('leave_types').upsert(type);
  if (error) throw error;
};

export const deleteLeaveType = async (typeId: string) => {
  const { error } = await supabase.from('leave_types').delete().eq('id', typeId);
  if (error) throw error;
};

// App Settings (key‑value store)
export const fetchSettings = async () => {
  const { data, error } = await supabase.from('app_settings').select('*');
  if (error) throw error;
  return data;
};

export const upsertSetting = async (setting: { key: string; value: string }) => {
  const { error } = await supabase.from('app_settings').upsert(setting);
  if (error) throw error;
};
