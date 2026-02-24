import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NODE_TYPES, type NodeType } from "./WorkflowNodePalette";
import { ArrowDown, GripVertical, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface WorkflowNode {
  id: string;
  nodeType: string;
  label: string;
  order: number;
  config?: {
    assignee?: string;
    description?: string;
    timeoutHours?: number;
  };
}

interface Props {
  nodes: WorkflowNode[];
  setNodes: React.Dispatch<React.SetStateAction<WorkflowNode[]>>;
  onNodeClick: (node: WorkflowNode) => void;
  isZh: boolean;
}

const WorkflowCanvas = ({ nodes, setNodes, onNodeClick, isZh }: Props) => {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [reorderDragIndex, setReorderDragIndex] = useState<number | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDropOnCanvas = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("application/workflow-node");
    if (!data) return;

    const nodeType: NodeType = JSON.parse(data);
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      nodeType: nodeType.type,
      label: isZh ? nodeType.labelZh : nodeType.labelEn,
      order: nodes.length,
    };
    setNodes((prev) => [...prev, newNode]);
    setDragOverIndex(null);
  };

  const handleDropOnSlot = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();

    // Handle reordering
    const reorderData = e.dataTransfer.getData("application/reorder-node");
    if (reorderData) {
      const fromIndex = parseInt(reorderData);
      if (fromIndex === index || fromIndex === index - 1) {
        setDragOverIndex(null);
        setReorderDragIndex(null);
        return;
      }
      setNodes((prev) => {
        const updated = [...prev];
        const [moved] = updated.splice(fromIndex, 1);
        const insertAt = fromIndex < index ? index - 1 : index;
        updated.splice(insertAt, 0, moved);
        return updated.map((n, i) => ({ ...n, order: i }));
      });
      setDragOverIndex(null);
      setReorderDragIndex(null);
      return;
    }

    // Handle new node from palette
    const data = e.dataTransfer.getData("application/workflow-node");
    if (!data) return;

    const nodeType: NodeType = JSON.parse(data);
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      nodeType: nodeType.type,
      label: isZh ? nodeType.labelZh : nodeType.labelEn,
      order: index,
    };
    setNodes((prev) => {
      const updated = [...prev];
      updated.splice(index, 0, newNode);
      return updated.map((n, i) => ({ ...n, order: i }));
    });
    setDragOverIndex(null);
  };

  const handleReorderDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("application/reorder-node", index.toString());
    e.dataTransfer.effectAllowed = "move";
    setReorderDragIndex(index);
  };

  const getNodeMeta = (nodeType: string) => {
    return NODE_TYPES.find((nt) => nt.type === nodeType);
  };

  const sortedNodes = [...nodes].sort((a, b) => a.order - b.order);

  return (
    <div
      ref={canvasRef}
      className="flex-1 bg-muted/30 overflow-auto p-8"
      onDragOver={handleDragOver}
      onDrop={handleDropOnCanvas}
    >
      <div className="max-w-lg mx-auto flex flex-col items-center">
        {/* Start Node */}
        <div className="w-28 h-10 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          {isZh ? "开始" : "Start"}
        </div>

        {sortedNodes.length === 0 && (
          <div
            className="mt-4 w-72 h-32 border-2 border-dashed border-muted-foreground/30 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors"
            onDragOver={(e) => { e.preventDefault(); setDragOverIndex(0); }}
            onDragLeave={() => setDragOverIndex(null)}
            onDrop={(e) => handleDropOnSlot(e, 0)}
          >
            <p className="text-sm text-muted-foreground">
              {isZh ? "拖拽节点到这里" : "Drop nodes here"}
            </p>
            <p className="text-[10px] text-muted-foreground/60">
              {isZh ? "从左侧面板拖入节点类型" : "Drag from the left panel"}
            </p>
          </div>
        )}

        {sortedNodes.map((node, index) => {
          const meta = getNodeMeta(node.nodeType);
          const Icon = meta?.icon;
          return (
            <div key={node.id} className="flex flex-col items-center w-full">
              {/* Drop zone above */}
              <div
                className={`w-full flex justify-center py-1 transition-all ${
                  dragOverIndex === index ? "py-3" : ""
                }`}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverIndex(index); }}
                onDragLeave={() => setDragOverIndex(null)}
                onDrop={(e) => handleDropOnSlot(e, index)}
              >
                <div className="flex flex-col items-center">
                  <ArrowDown className="w-4 h-4 text-muted-foreground/40" />
                  {dragOverIndex === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 40 }}
                      className="w-64 h-10 border-2 border-dashed border-primary/50 rounded-lg bg-primary/5 flex items-center justify-center"
                    >
                      <span className="text-xs text-primary">
                        {isZh ? "放置到此处" : "Drop here"}
                      </span>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Node */}
              <AnimatePresence>
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: reorderDragIndex === index ? 0.5 : 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={`w-72 border rounded-xl px-4 py-3 flex items-center gap-3 bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer group ${meta?.color || ""}`}
                  onClick={() => onNodeClick(node)}
                >
                  <div
                    draggable
                    onDragStart={(e) => handleReorderDragStart(e, index)}
                    className="cursor-grab active:cursor-grabbing p-1 -ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                  </div>
                  {Icon && <Icon className="w-5 h-5 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{node.label}</p>
                    {node.config?.assignee && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        {isZh ? "处理人: " : "Assignee: "}{node.config.assignee}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => { e.stopPropagation(); onNodeClick(node); }}
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </Button>
                </motion.div>
              </AnimatePresence>
            </div>
          );
        })}

        {/* Drop zone at the end */}
        {sortedNodes.length > 0 && (
          <div
            className={`w-full flex flex-col items-center py-1 transition-all ${
              dragOverIndex === sortedNodes.length ? "py-3" : ""
            }`}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverIndex(sortedNodes.length); }}
            onDragLeave={() => setDragOverIndex(null)}
            onDrop={(e) => handleDropOnSlot(e, sortedNodes.length)}
          >
            <ArrowDown className="w-4 h-4 text-muted-foreground/40" />
            {dragOverIndex === sortedNodes.length && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 40 }}
                className="w-64 h-10 border-2 border-dashed border-primary/50 rounded-lg bg-primary/5 flex items-center justify-center"
              >
                <span className="text-xs text-primary">
                  {isZh ? "放置到此处" : "Drop here"}
                </span>
              </motion.div>
            )}
          </div>
        )}

        {/* End Node */}
        <div className="mt-2 w-28 h-10 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center text-xs font-semibold text-red-700 dark:text-red-400">
          {isZh ? "结束" : "End"}
        </div>
      </div>
    </div>
  );
};

export default WorkflowCanvas;
