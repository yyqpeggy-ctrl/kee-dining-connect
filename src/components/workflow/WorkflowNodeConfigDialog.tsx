import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import type { WorkflowNode } from "./WorkflowCanvas";

interface Props {
  node: WorkflowNode | null;
  open: boolean;
  onClose: () => void;
  onSave: (node: WorkflowNode) => void;
  onDelete: (nodeId: string) => void;
  isZh: boolean;
}

const WorkflowNodeConfigDialog = ({ node, open, onClose, onSave, onDelete, isZh }: Props) => {
  const [label, setLabel] = useState("");
  const [assignee, setAssignee] = useState("");
  const [description, setDescription] = useState("");
  const [timeoutHours, setTimeoutHours] = useState("24");

  useEffect(() => {
    if (node) {
      setLabel(node.label);
      setAssignee(node.config?.assignee || "");
      setDescription(node.config?.description || "");
      setTimeoutHours(node.config?.timeoutHours?.toString() || "24");
    }
  }, [node]);

  if (!node) return null;

  const handleSave = () => {
    onSave({
      ...node,
      label,
      config: {
        ...node.config,
        assignee,
        description,
        timeoutHours: parseInt(timeoutHours) || 24,
      },
    });
    onClose();
  };

  const assigneeOptions = [
    { value: "manager", labelZh: "直属主管", labelEn: "Direct Manager" },
    { value: "department_head", labelZh: "部门负责人", labelEn: "Department Head" },
    { value: "finance", labelZh: "财务负责人", labelEn: "Finance Manager" },
    { value: "gm", labelZh: "总经理", labelEn: "General Manager" },
    { value: "hr", labelZh: "人事负责人", labelEn: "HR Manager" },
    { value: "initiator", labelZh: "发起人", labelEn: "Initiator" },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isZh ? "配置节点" : "Configure Node"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>{isZh ? "节点名称" : "Node Name"}</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>

          {(node.nodeType === "approval" || node.nodeType === "review") && (
            <div className="space-y-2">
              <Label>{isZh ? "处理人" : "Assignee"}</Label>
              <Select value={assignee} onValueChange={setAssignee}>
                <SelectTrigger>
                  <SelectValue placeholder={isZh ? "选择处理人" : "Select assignee"} />
                </SelectTrigger>
                <SelectContent>
                  {assigneeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {isZh ? opt.labelZh : opt.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {node.nodeType === "timer" && (
            <div className="space-y-2">
              <Label>{isZh ? "超时时间（小时）" : "Timeout (hours)"}</Label>
              <Input type="number" value={timeoutHours} onChange={(e) => setTimeoutHours(e.target.value)} />
            </div>
          )}

          <div className="space-y-2">
            <Label>{isZh ? "描述" : "Description"}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isZh ? "节点描述..." : "Node description..."}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => { onDelete(node.id); onClose(); }}
          >
            {isZh ? "删除节点" : "Delete"}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>{isZh ? "取消" : "Cancel"}</Button>
            <Button onClick={handleSave}>{isZh ? "保存" : "Save"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WorkflowNodeConfigDialog;
