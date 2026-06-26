// app/(app)/projects/[id]/reporting/page.tsx
import React from 'react';
import { getReportingLines, buildReportingTree, ReportingNode } from '@/lib/actions/reporting';
import ReportingTree from '@/components/app/ReportingTree';

export const dynamic = 'force-dynamic'; // ensure fresh fetch on each request

export default async function ReportingPage({ params }: { params: { id: string } }) {
  const projectId = params.id;
  const lines: ReportingNode[] = await getReportingLines(projectId);
  const tree = buildReportingTree(lines);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Reporting Lines</h1>
      {tree.length === 0 ? (
        <p>No reporting hierarchy defined.</p>
      ) : (
        <ReportingTree nodes={tree} />
      )}
    </div>
  );
}
