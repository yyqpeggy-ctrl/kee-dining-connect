import { useState } from "react";
import { useTranslation } from "react-i18next";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GitBranch, Play, Pause, Plus, CheckCircle, Clock, Edit } from "lucide-react";
import WorkflowEditor from "@/components/workflow/WorkflowEditor";

const Workflow = () => {
  const { i18n } = useTranslation();
  const isZh = i18n.language?.startsWith("zh");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingWorkflowName, setEditingWorkflowName] = useState<string | undefined>();

  const workflows = [
    { id: 1, name: isZh ? "采购审批流程" : "Procurement Approval", status: "active", steps: 4, pending: 2, completed: 12 },
    { id: 2, name: isZh ? "请假审批流程" : "Leave Approval", status: "active", steps: 3, pending: 1, completed: 28 },
    { id: 3, name: isZh ? "合同签署流程" : "Contract Signing", status: "paused", steps: 5, pending: 0, completed: 6 },
    { id: 4, name: isZh ? "费用报销流程" : "Expense Reimbursement", status: "active", steps: 3, pending: 5, completed: 45 },
  ];

  const handleNewWorkflow = () => {
    setEditingWorkflowName(undefined);
    setEditorOpen(true);
  };

  const handleEditWorkflow = (name: string) => {
    setEditingWorkflowName(name);
    setEditorOpen(true);
  };

  if (editorOpen) {
    return (
      <AppLayout>
        <WorkflowEditor
          isZh={isZh}
          workflowName={editingWorkflowName}
          onBack={() => setEditorOpen(false)}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isZh ? "流程中心" : "Workflow Center"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isZh ? "管理和监控业务审批流程" : "Manage and monitor business approval workflows"}
            </p>
          </div>
          <Button onClick={handleNewWorkflow}>
            <Plus className="w-4 h-4 mr-2" />
            {isZh ? "新建流程" : "New Workflow"}
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <GitBranch className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{workflows.length}</p>
                  <p className="text-xs text-muted-foreground">{isZh ? "流程总数" : "Total Workflows"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {workflows.reduce((sum, w) => sum + w.pending, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">{isZh ? "待处理" : "Pending"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {workflows.reduce((sum, w) => sum + w.completed, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">{isZh ? "已完成" : "Completed"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Workflow List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workflows.map((wf) => (
            <Card key={wf.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">{wf.name}</CardTitle>
                <Badge variant={wf.status === "active" ? "default" : "secondary"}>
                  {wf.status === "active"
                    ? isZh ? "运行中" : "Active"
                    : isZh ? "已暂停" : "Paused"}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                  <span>{isZh ? `${wf.steps} 个步骤` : `${wf.steps} steps`}</span>
                  <span>{isZh ? `${wf.pending} 待处理` : `${wf.pending} pending`}</span>
                  <span>{isZh ? `${wf.completed} 已完成` : `${wf.completed} completed`}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    {wf.status === "active" ? (
                      <><Pause className="w-3 h-3 mr-1" />{isZh ? "暂停" : "Pause"}</>
                    ) : (
                      <><Play className="w-3 h-3 mr-1" />{isZh ? "启动" : "Start"}</>
                    )}
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditWorkflow(wf.name)}>
                    <Edit className="w-3 h-3 mr-1" />
                    {isZh ? "编辑流程" : "Edit"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Workflow;
