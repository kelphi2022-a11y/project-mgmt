// lib/actions/reporting.ts
import { supabase } from '@/app/lib/supabase';

export type ReportingNode = {
  id: string;
  user_id: string;
  manager_id: string | null;
  name: string;
  children?: ReportingNode[];
};

/** Fetch flat list of reporting lines for a project */
export async function getReportingLines(projectId: string) {
  const { data, error } = await supabase
    .from('reporting_lines')
    .select('id, user_id, manager_id, name')
    .eq('project_id', projectId);
  if (error) throw error;
  return data as ReportingNode[];
}

/** Build a tree structure from flat list */
export function buildReportingTree(nodes: ReportingNode[]): ReportingNode[] {
  const map = new Map<string, ReportingNode>();
  const roots: ReportingNode[] = [];
  nodes.forEach((n) => {
    map.set(n.id, { ...n, children: [] });
  });
  map.forEach((node) => {
    if (node.manager_id && map.has(node.manager_id)) {
      const parent = map.get(node.manager_id)!;
      parent.children!.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}
