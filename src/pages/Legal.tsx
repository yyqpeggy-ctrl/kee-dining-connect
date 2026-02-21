import { motion } from "framer-motion";
import {
  Scale, FileText, AlertTriangle, CheckCircle, Clock, Calendar,
  Download, Plus, Eye, MoreHorizontal, Shield, Gavel
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface Contract {
  id: string;
  titleZh: string;
  titleEn: string;
  type: "lease" | "supplier" | "employment" | "franchise" | "license";
  partyZh: string;
  partyEn: string;
  signDate: string;
  expireDate: string;
  status: "active" | "expiring" | "expired" | "pending";
  value?: string;
}

interface Compliance {
  id: string;
  nameZh: string;
  nameEn: string;
  categoryZh: string;
  categoryEn: string;
  dueDate: string;
  status: "compliant" | "pending" | "overdue";
}

const contracts: Contract[] = [
  { id: "C001", titleZh: "总店租赁合同", titleEn: "Main Store Lease", type: "lease", partyZh: "北京华贸物业", partyEn: "Beijing Huamao Properties", signDate: "2023-01-01", expireDate: "2025-12-31", status: "active", value: "¥50万/年" },
  { id: "C002", titleZh: "海鲜供应协议", titleEn: "Seafood Supply Agreement", type: "supplier", partyZh: "大连鑫海水产", partyEn: "Dalian Xinhai Seafood", signDate: "2024-01-01", expireDate: "2024-12-31", status: "expiring", value: "¥200万/年" },
  { id: "C003", titleZh: "厨师长劳动合同", titleEn: "Head Chef Employment Contract", type: "employment", partyZh: "张明", partyEn: "Zhang Ming", signDate: "2022-03-15", expireDate: "2025-03-14", status: "active" },
  { id: "C004", titleZh: "食品经营许可证", titleEn: "Food Business License", type: "license", partyZh: "市场监督管理局", partyEn: "Market Supervision Bureau", signDate: "2023-06-01", expireDate: "2026-05-31", status: "active" },
  { id: "C005", titleZh: "望京分店加盟协议", titleEn: "Wangjing Branch Franchise", type: "franchise", partyZh: "北京望京餐饮", partyEn: "Beijing Wangjing F&B", signDate: "2024-06-01", expireDate: "2029-05-31", status: "pending", value: "¥80万" },
];

const complianceItems: Compliance[] = [
  { id: "L001", nameZh: "食品经营许可证年检", nameEn: "Food License Annual Inspection", categoryZh: "食品安全", categoryEn: "Food Safety", dueDate: "2024-06-01", status: "compliant" },
  { id: "L002", nameZh: "消防安全检查", nameEn: "Fire Safety Inspection", categoryZh: "安全", categoryEn: "Safety", dueDate: "2024-03-15", status: "pending" },
  { id: "L003", nameZh: "员工健康证更新", nameEn: "Staff Health Certificate Renewal", categoryZh: "人员", categoryEn: "Personnel", dueDate: "2024-02-28", status: "overdue" },
  { id: "L004", nameZh: "环保排污许可", nameEn: "Environmental Discharge Permit", categoryZh: "环保", categoryEn: "Environment", dueDate: "2024-08-01", status: "compliant" },
  { id: "L005", nameZh: "税务申报", nameEn: "Tax Filing", categoryZh: "财税", categoryEn: "Finance & Tax", dueDate: "2024-02-15", status: "pending" },
];

const Legal = () => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const [activeTab, setActiveTab] = useState<"contracts" | "compliance">("contracts");

  const typeLabels: Record<string, string> = {
    lease: t("legalMgmt.lease"),
    supplier: t("legalMgmt.supplierAgreement"),
    employment: t("legalMgmt.employment"),
    franchise: t("legalMgmt.franchise"),
    license: t("legalMgmt.license"),
  };

  const expiringCount = contracts.filter((c) => c.status === "expiring").length;
  const overdueCount = complianceItems.filter((c) => c.status === "overdue").length;

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display">{t("legalMgmt.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("legalMgmt.subtitle")}</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />{t("legalMgmt.newContract")}
        </button>
      </div>

      {/* Alerts */}
      {(expiringCount > 0 || overdueCount > 0) && (
        <div className="flex gap-4 mb-6">
          {expiringCount > 0 && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex-1 glass-card rounded-xl p-4 border-l-4 border-l-warning">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center"><Clock className="w-4 h-4 text-warning" /></div>
                <div>
                  <p className="font-medium text-sm">{t("legalMgmt.contractExpiring")}</p>
                  <p className="text-xs text-muted-foreground">{expiringCount} {t("legalMgmt.expiringIn30Days")}</p>
                </div>
              </div>
            </motion.div>
          )}
          {overdueCount > 0 && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }} className="flex-1 glass-card rounded-xl p-4 border-l-4 border-l-destructive">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-destructive" /></div>
                <div>
                  <p className="font-medium text-sm">{t("legalMgmt.complianceOverdue")}</p>
                  <p className="text-xs text-muted-foreground">{overdueCount} {t("legalMgmt.overdueItems")}</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"><FileText className="w-4 h-4 text-primary" /></div><div><p className="text-2xl font-bold">{contracts.length}</p><p className="text-xs text-muted-foreground">{t("legalMgmt.totalContracts")}</p></div></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center"><CheckCircle className="w-4 h-4 text-success" /></div><div><p className="text-2xl font-bold">{contracts.filter(c => c.status === "active").length}</p><p className="text-xs text-muted-foreground">{t("legalMgmt.activeContracts")}</p></div></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-info/10 flex items-center justify-center"><Shield className="w-4 h-4 text-info" /></div><div><p className="text-2xl font-bold">{complianceItems.length}</p><p className="text-xs text-muted-foreground">{t("legalMgmt.complianceItems")}</p></div></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center"><Gavel className="w-4 h-4 text-warning" /></div><div><p className="text-2xl font-bold">0</p><p className="text-xs text-muted-foreground">{t("legalMgmt.legalDisputes")}</p></div></div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 bg-muted/50 rounded-lg w-fit">
        <button onClick={() => setActiveTab("contracts")} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === "contracts" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>{t("legalMgmt.contractMgmt")}</button>
        <button onClick={() => setActiveTab("compliance")} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === "compliance" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>{t("legalMgmt.complianceMonitoring")}</button>
      </div>

      {activeTab === "contracts" ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">{t("legalMgmt.contractName")}</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">{t("legalMgmt.contractType")}</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">{t("legalMgmt.counterparty")}</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">{t("legalMgmt.expiryDate")}</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">{t("legalMgmt.contractValue")}</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">{t("common.status")}</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract, i) => (
                  <motion.tr key={contract.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary/60" />
                        <span className="font-medium">{isZh ? contract.titleZh : contract.titleEn}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{typeLabels[contract.type]}</td>
                    <td className="py-3 px-4">{isZh ? contract.partyZh : contract.partyEn}</td>
                    <td className="py-3 px-4 text-muted-foreground">{contract.expireDate}</td>
                    <td className="py-3 px-4 text-right font-medium">{contract.value || "-"}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        contract.status === "active" ? "bg-success/10 text-success" :
                        contract.status === "expiring" ? "bg-warning/10 text-warning" :
                        contract.status === "pending" ? "bg-info/10 text-info" :
                        "bg-destructive/10 text-destructive"
                      }`}>
                        {contract.status === "active" ? t("legalMgmt.active") : contract.status === "expiring" ? t("legalMgmt.expiring") : contract.status === "pending" ? t("legalMgmt.pendingApproval") : t("legalMgmt.expired")}
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
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{isZh ? item.categoryZh : item.categoryEn}</span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  item.status === "compliant" ? "bg-success/10 text-success" :
                  item.status === "pending" ? "bg-warning/10 text-warning" :
                  "bg-destructive/10 text-destructive"
                }`}>
                  {item.status === "compliant" ? t("legalMgmt.compliant") : item.status === "pending" ? t("legalMgmt.pendingCompliance") : t("legalMgmt.overdue")}
                </span>
              </div>
              <h4 className="font-medium mb-2">{isZh ? item.nameZh : item.nameEn}</h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>{t("legalMgmt.dueDate")}: {item.dueDate}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </AppLayout>
  );
};

export default Legal;
