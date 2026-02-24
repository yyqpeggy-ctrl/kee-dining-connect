import { useState } from "react";
import { useTranslation } from "react-i18next";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GitBranch, Play, Pause, Plus, CheckCircle, Clock, Edit,
  Link2, AlertTriangle, Zap
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import WorkflowEditor from "@/components/workflow/WorkflowEditor";
import { WORKFLOW_TEMPLATES, WORKFLOW_CATEGORIES, type WorkflowTemplate } from "@/data/workflowTemplates";

const Workflow = () => {
  const { i18n } = useTranslation();
  const isZh = i18n.language?.startsWith("zh");
  const navigate = useNavigate();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowTemplate | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const handleNewWorkflow = () => {
    setEditingWorkflow(null);
    setEditorOpen(true);
  };

  const handleEditWorkflow = (wf: WorkflowTemplate) => {
    setEditingWorkflow(wf);
    setEditorOpen(true);
  };

  const filteredWorkflows = activeTab === "all"
    ? WORKFLOW_TEMPLATES
    : WORKFLOW_TEMPLATES.filter((wf) => wf.category === activeTab);

  const totalPending = WORKFLOW_TEMPLATES.reduce((sum, w) => sum + w.pending, 0);
  const totalCompleted = WORKFLOW_TEMPLATES.reduce((sum, w) => sum + w.completed, 0);
  const totalLinkedModules = new Set(WORKFLOW_TEMPLATES.flatMap((w) => w.linkedModules.map((m) => m.route))).size;

  if (editorOpen) {
    return (
      <AppLayout>
        <WorkflowEditor
          isZh={isZh}
          workflowName={editingWorkflow ? (isZh ? editingWorkflow.nameZh : editingWorkflow.nameEn) : undefined}
          initialNodes={editingWorkflow?.nodes}
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
              {isZh ? "餐饮行业标准化审批流程，智能联动全业务模块" : "Industry-standard approval workflows with intelligent cross-module linkage"}
            </p>
          </div>
          <Button onClick={handleNewWorkflow}>
            <Plus className="w-4 h-4 mr-2" />
            {isZh ? "新建流程" : "New Workflow"}
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <GitBranch className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{WORKFLOW_TEMPLATES.length}</p>
                  <p className="text-xs text-muted-foreground">{isZh ? "标准流程" : "Workflows"}</p>
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
                  <p className="text-2xl font-bold text-foreground">{totalPending}</p>
                  <p className="text-xs text-muted-foreground">{isZh ? "待审批" : "Pending"}</p>
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
                  <p className="text-2xl font-bold text-foreground">{totalCompleted}</p>
                  <p className="text-xs text-muted-foreground">{isZh ? "已完成" : "Completed"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Link2 className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalLinkedModules}</p>
                  <p className="text-xs text-muted-foreground">{isZh ? "联动模块" : "Linked Modules"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="all">
              {isZh ? "全部" : "All"} ({WORKFLOW_TEMPLATES.length})
            </TabsTrigger>
            {Object.entries(WORKFLOW_CATEGORIES).map(([key, cat]) => {
              const count = WORKFLOW_TEMPLATES.filter((w) => w.category === key).length;
              if (count === 0) return null;
              return (
                <TabsTrigger key={key} value={key}>
                  {isZh ? cat.labelZh : cat.labelEn} ({count})
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredWorkflows.map((wf) => (
                <Card key={wf.id} className="group hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-base truncate">
                            {isZh ? wf.nameZh : wf.nameEn}
                          </CardTitle>
                          <Badge variant={wf.status === "active" ? "default" : "secondary"} className="shrink-0">
                            {wf.status === "active"
                              ? isZh ? "运行中" : "Active"
                              : isZh ? "已暂停" : "Paused"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {isZh ? wf.descZh : wf.descEn}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {wf.nodes.length} {isZh ? "节点" : "nodes"}
                      </span>
                      {wf.pending > 0 && (
                        <span className="flex items-center gap-1 text-amber-600">
                          <AlertTriangle className="w-3 h-3" />
                          {wf.pending} {isZh ? "待处理" : "pending"}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {wf.completed} {isZh ? "已完成" : "done"}
                      </span>
                    </div>

                    {/* Linked Modules */}
                    <div className="mb-3">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                        <Link2 className="w-3 h-3 inline mr-1" />
                        {isZh ? "联动模块" : "Linked Modules"}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {wf.linkedModules.map((mod) => (
                          <button
                            key={mod.route}
                            onClick={(e) => { e.stopPropagation(); navigate(mod.route); }}
                            className={`text-[10px] px-2 py-0.5 rounded-full border font-medium hover:opacity-80 transition-opacity ${mod.color}`}
                          >
                            {isZh ? mod.nameZh : mod.nameEn}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        {wf.status === "active" ? (
                          <><Pause className="w-3 h-3 mr-1" />{isZh ? "暂停" : "Pause"}</>
                        ) : (
                          <><Play className="w-3 h-3 mr-1" />{isZh ? "启动" : "Start"}</>
                        )}
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditWorkflow(wf)}>
                        <Edit className="w-3 h-3 mr-1" />
                        {isZh ? "编辑流程" : "Edit"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Workflow;
