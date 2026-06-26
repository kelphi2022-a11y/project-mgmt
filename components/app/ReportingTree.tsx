import React from 'react';
import { ChevronRight, Users } from 'lucide-react';
import { ReportingNode } from '@/lib/actions/reporting';

interface ReportingTreeProps {
  nodes: ReportingNode[];
}

export default function ReportingTree({ nodes }: ReportingTreeProps) {
  if (!nodes || nodes.length === 0) return null;

  const renderNode = (node: ReportingNode, depth = 0) => (
    <div key={node.id} className="ml-4 border-l pl-2 mt-2">
      <div className="flex items-center space-x-2">
        <Users className="w-4 h-4 text-muted" />
        <span className="font-medium">{node.name}</span>
      </div>
      {node.children && node.children.length > 0 && (
        <div className="ml-4 mt-1">
          {node.children.map((child) => renderNode(child, depth + 1))}
        </div>
      )}
    </div>
  );

  return <div>{nodes.map((node) => renderNode(node))}</div>;
}
