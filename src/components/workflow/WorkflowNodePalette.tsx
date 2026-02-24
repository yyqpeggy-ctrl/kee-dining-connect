import { 
  UserCheck, GitBranch, Bell, FileCheck, Clock, 
  Send, ShieldCheck, MessageSquare, Zap 
} from "lucide-react";

export interface NodeType {
  type: string;
  labelZh: string;
  labelEn: string;
  icon: React.ElementType;
  color: string;
}

export const NODE_TYPES: NodeType[] = [
  { type: "approval", labelZh: "审批节点", labelEn: "Approval", icon: UserCheck, color: "bg-primary/10 text-primary border-primary/30" },
  { type: "condition", labelZh: "条件分支", labelEn: "Condition", icon: GitBranch, color: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
  { type: "notification", labelZh: "通知节点", labelEn: "Notification", icon: Bell, color: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  { type: "review", labelZh: "会签节点", labelEn: "Review", icon: FileCheck, color: "bg-purple-500/10 text-purple-600 border-purple-500/30" },
  { type: "timer", labelZh: "定时节点", labelEn: "Timer", icon: Clock, color: "bg-orange-500/10 text-orange-600 border-orange-500/30" },
  { type: "webhook", labelZh: "外部调用", labelEn: "Webhook", icon: Send, color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
  { type: "permission", labelZh: "权限检查", labelEn: "Permission", icon: ShieldCheck, color: "bg-red-500/10 text-red-600 border-red-500/30" },
  { type: "auto", labelZh: "自动处理", labelEn: "Auto Process", icon: Zap, color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/30" },
];

interface Props {
  isZh: boolean;
}

const WorkflowNodePalette = ({ isZh }: Props) => {
  const handleDragStart = (e: React.DragEvent, nodeType: NodeType) => {
    e.dataTransfer.setData("application/workflow-node", JSON.stringify(nodeType));
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="w-56 border-r border-border bg-card p-4 flex flex-col gap-2 overflow-y-auto">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        {isZh ? "节点类型" : "Node Types"}
      </p>
      <p className="text-[10px] text-muted-foreground mb-3">
        {isZh ? "拖拽节点到画布中" : "Drag nodes to canvas"}
      </p>
      {NODE_TYPES.map((nt) => (
        <div
          key={nt.type}
          draggable
          onDragStart={(e) => handleDragStart(e, nt)}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-grab active:cursor-grabbing transition-all hover:shadow-sm ${nt.color}`}
        >
          <nt.icon className="w-4 h-4 shrink-0" />
          <span className="text-xs font-medium">{isZh ? nt.labelZh : nt.labelEn}</span>
        </div>
      ))}
    </div>
  );
};

export default WorkflowNodePalette;
