import { motion } from "framer-motion";
import {
  Scale, FileText, AlertTriangle, CheckCircle, Clock, Calendar,
  Download, Plus, Eye, MoreHorizontal, Shield, Gavel
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useState } from "react";

interface Contract {
  id: string;
  title: string;
  type: "lease" | "supplier" | "employment" | "franchise" | "license";
  party: string;
  signDate: string;
  expireDate: string;
  status: "active" | "expiring" | "expired" | "pending";
  value?: string;
}

interface Compliance {
  id: string;
  name: string;
  category: string;
  dueDate: string;
  status: "compliant" | "pending" | "overdue";
}

const contracts: Contract[] = [
  { id: "C001", title: "总店租赁合同", type: "lease", party: "北京华贸物业", signDate: "2023-01-01", expireDate: "2025-12-31", status: "active", value: "¥50万/年" },
  { id: "C002", title: "海鲜供应协议", type: "supplier", party: "大连鑫海水产", signDate: "2024-01-01", expireDate: "2024-12-31", status: "expiring", value: "¥200万/年" },
  { id: "C003", title: "厨师长劳动合同", type: "employment", party: "张明", signDate: "2022-03-15", expireDate: "2025-03-14", status: "active" },
  { id: "C004", title: "食品经营许可证", type: "license", party: "市场监督管理局", signDate: "2023-06-01", expireDate: "2026-05-31", status: "active" },
  { id: "C005", title: "望京分店加盟协议", type: "franchise", party: "北京望京餐饮", signDate: "2024-06-01", expireDate: "2029-05-31", status: "pending", value: "¥80万" },
];

const complianceItems: Compliance[] = [
  { id: "L001", name: "食品经营许可证年检", category: "食品安全", dueDate: "2024-06-01", status: "compliant" },
  { id: "L002", name: "消防安全检查", category: "安全", dueDate: "2024-03-15", status: "pending" },
  { id: "L003", name: "员工健康证更新", category: "人员", dueDate: "2024-02-28", status: "overdue" },
  { id: "L004", name: "环保排污许可", category: "环保", dueDate: "2024-08-01", status: "compliant" },
  { id: "L005", name: "税务申报", category: "财税", dueDate: "2024-02-15", status: "pending" },
];

const typeLabels: Record<string, string> = {
  lease: "租赁合同",
  supplier: "供应商协议",
  employment: "劳动合同",
  franchise: "加盟协议",
  license: "资质证照",
};

const Legal = () => {
  const [activeTab, setActiveTab] = useState<"contracts" | "compliance">("contracts");

  const expiringCount = contracts.filter((c) => c.status === "expiring").length;
  const overdueCount = complianceItems.filter((c) => c.status === "overdue").length;

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display">法务管理</h1>
          <p className="text-sm text-muted-foreground mt-1">合同管理与合规监控</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          新增合同
        </button>
      </div>

      {/* Alerts */}
      {(expiringCount > 0 || overdueCount > 0) && (
        <div className="flex gap-4 mb-6">
          {expiringCount > 0 && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex-1 glass-card rounded-xl p-4 border-l-4 border-l-warning">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-warning" />
                </div>
                <div>
                  <p className="font-medium text-sm">合同即将到期</p>
                  <p className="text-xs text-muted-foreground">{expiringCount} 份合同将在30天内到期</p>
                </div>
              </div>
            </motion.div>
          )}
          {overdueCount > 0 && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }} className="flex-1 glass-card rounded-xl p-4 border-l-4 border-l-destructive">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                </div>
                <div>
                  <p className="font-medium text-sm">合规事项逾期</p>
                  <p className="text-xs text-muted-foreground">{overdueCount} 项合规检查已过期</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{contracts.length}</p>
              <p className="text-xs text-muted-foreground">合同总数</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{contracts.filter(c => c.status === "active").length}</p>
              <p className="text-xs text-muted-foreground">有效合同</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-info/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">{complianceItems.length}</p>
              <p className="text-xs text-muted-foreground">合规事项</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center">
              <Gavel className="w-4 h-4 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-muted-foreground">法律纠纷</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 bg-muted/50 rounded-lg w-fit">
        <button onClick={() => setActiveTab("contracts")} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === "contracts" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
          合同管理
        </button>
        <button onClick={() => setActiveTab("compliance")} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === "compliance" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
          合规监控
        </button>
      </div>

      {activeTab === "contracts" ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">合同名称</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">类型</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">签约方</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">到期日期</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">金额</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">状态</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract, i) => (
                  <motion.tr key={contract.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary/60" />
                        <span className="font-medium">{contract.title}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{typeLabels[contract.type]}</td>
                    <td className="py-3 px-4">{contract.party}</td>
                    <td className="py-3 px-4 text-muted-foreground">{contract.expireDate}</td>
                    <td className="py-3 px-4 text-right font-medium">{contract.value || "-"}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        contract.status === "active" ? "bg-success/10 text-success" :
                        contract.status === "expiring" ? "bg-warning/10 text-warning" :
                        contract.status === "pending" ? "bg-info/10 text-info" :
                        "bg-destructive/10 text-destructive"
                      }`}>
                        {contract.status === "active" ? "有效" : contract.status === "expiring" ? "即将到期" : contract.status === "pending" ? "待审批" : "已过期"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button className="p-1.5 rounded-md hover:bg-muted"><Eye className="w-4 h-4 text-muted-foreground" /></button>
                        <button className="p-1.5 rounded-md hover:bg-muted"><Download className="w-4 h-4 text-muted-foreground" /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {complianceItems.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{item.category}</span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  item.status === "compliant" ? "bg-success/10 text-success" :
                  item.status === "pending" ? "bg-warning/10 text-warning" :
                  "bg-destructive/10 text-destructive"
                }`}>
                  {item.status === "compliant" ? "已完成" : item.status === "pending" ? "待处理" : "已逾期"}
                </span>
              </div>
              <h4 className="font-medium mb-2">{item.name}</h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>截止日期: {item.dueDate}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </AppLayout>
  );
};

export default Legal;
