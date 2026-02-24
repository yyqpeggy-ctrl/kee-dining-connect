import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import WorkflowNodePalette from "./WorkflowNodePalette";
import WorkflowCanvas, { type WorkflowNode } from "./WorkflowCanvas";
import WorkflowNodeConfigDialog from "./WorkflowNodeConfigDialog";

interface Props {
  isZh: boolean;
  workflowName?: string;
  onBack: () => void;
}

const WorkflowEditor = ({ isZh, workflowName, onBack }: Props) => {
  const [name, setName] = useState(workflowName || (isZh ? "新流程" : "New Workflow"));
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
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
