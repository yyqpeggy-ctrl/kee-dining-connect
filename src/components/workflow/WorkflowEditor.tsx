import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Link2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import WorkflowNodePalette from "./WorkflowNodePalette";
import WorkflowCanvas, { type WorkflowNode } from "./WorkflowCanvas";
import WorkflowNodeConfigDialog from "./WorkflowNodeConfigDialog";

interface Props {
  isZh: boolean;
  workflowName?: string;
  initialNodes?: WorkflowNode[];
  onBack: () => void;
}

const WorkflowEditor = ({ isZh, workflowName, initialNodes, onBack }: Props) => {
  const [name, setName] = useState(workflowName || (isZh ? "新流程" : "New Workflow"));
  const [nodes, setNodes] = useState<WorkflowNode[]>(initialNodes || []);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [configOpen, setConfigOpen] = useState(false);

  const handleNodeClick = (node: WorkflowNode) => {
    setSelectedNode(node);
    setConfigOpen(true);
  };

  const handleNodeSave = (updatedNode: WorkflowNode) => {
    setNodes((prev) => prev.map((n) => (n.id === updatedNode.id ? updatedNode : n)));
  };

  const handleNodeDelete = (nodeId: string) => {
    setNodes((prev) =>
      prev
        .filter((n) => n.id !== nodeId)
        .map((n, i) => ({ ...n, order: i }))
    );
  };

  const handleSave = () => {
    toast({
      title: isZh ? "流程已保存" : "Workflow Saved",
      description: isZh
        ? `"${name}" 包含 ${nodes.length} 个节点`
        : `"${name}" with ${nodes.length} nodes`,
    });
  };

  // Count node types for summary
  const nodeTypeCounts = nodes.reduce((acc, n) => {
    acc[n.nodeType] = (acc[n.nodeType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const nodeTypeLabels: Record<string, { zh: string; en: string }> = {
    approval: { zh: "审批", en: "Approval" },
    condition: { zh: "条件", en: "Condition" },
    notification: { zh: "通知", en: "Notify" },
    review: { zh: "会签", en: "Review" },
    timer: { zh: "定时", en: "Timer" },
    webhook: { zh: "外调", en: "Webhook" },
    permission: { zh: "权限", en: "Permission" },
    auto: { zh: "自动", en: "Auto" },
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col border rounded-xl overflow-hidden bg-card">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="max-w-xs font-medium"
        />
        <div className="flex-1" />

        {/* Node type summary badges */}
        <div className="hidden md:flex items-center gap-1.5">
          {Object.entries(nodeTypeCounts).map(([type, count]) => (
            <Badge key={type} variant="outline" className="text-[10px] px-1.5 py-0">
              {isZh ? nodeTypeLabels[type]?.zh : nodeTypeLabels[type]?.en} ×{count}
            </Badge>
          ))}
        </div>

        <span className="text-xs text-muted-foreground">
          {isZh ? `${nodes.length} 个节点` : `${nodes.length} nodes`}
        </span>
        <Button size="sm" onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          {isZh ? "保存流程" : "Save"}
        </Button>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <WorkflowNodePalette isZh={isZh} />
        <WorkflowCanvas
          nodes={nodes}
          setNodes={setNodes}
          onNodeClick={handleNodeClick}
          isZh={isZh}
        />
      </div>

      <WorkflowNodeConfigDialog
        node={selectedNode}
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        onSave={handleNodeSave}
        onDelete={handleNodeDelete}
        isZh={isZh}
      />
    </div>
  );
};

export default WorkflowEditor;
