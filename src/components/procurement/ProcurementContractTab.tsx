import { motion } from "framer-motion";
import { FileText, Shield, ShieldCheck, ShieldAlert, Link2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

interface Props {
  orders: Tables<"procurement_orders">[];
  onRefresh: () => void;
}

const ProcurementContractTab = ({ orders, onRefresh }: Props) => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contractNo, setContractNo] = useState("");

  const withContract = orders.filter(o => o.contract_number);
  const withoutContract = orders.filter(o => !o.contract_number && o.status !== "cancelled");

  const handleLinkContract = async (id: string) => {
    if (!contractNo.trim()) return;
    const { error } = await supabase.from("procurement_orders").update({
      contract_number: contractNo.trim(),
    }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(isZh ? "合同已关联" : "Contract linked"); setEditingId(null); setContractNo(""); onRefresh(); }
  };

  const handleComplianceCheck = async (id: string, passed: boolean) => {
    const { error } = await supabase.from("procurement_orders").update({
      compliance_checked: passed,
      compliance_notes: passed ? (isZh ? "合规检查通过" : "Compliance check passed") : "",
    }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(isZh ? "合规状态已更新" : "Compliance updated"); onRefresh(); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4 text-center">
          <FileText className="w-6 h-6 mx-auto mb-2 text-primary" />
          <p className="text-xl font-bold">{withContract.length}</p>
          <p className="text-xs text-muted-foreground">{isZh ? "已关联合同" : "With Contract"}</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <Link2 className="w-6 h-6 mx-auto mb-2 text-warning" />
          <p className="text-xl font-bold">{withoutContract.length}</p>
          <p className="text-xs text-muted-foreground">{isZh ? "待关联合同" : "No Contract"}</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <ShieldCheck className="w-6 h-6 mx-auto mb-2 text-success" />
          <p className="text-xl font-bold">{orders.filter(o => o.compliance_checked).length}</p>
          <p className="text-xs text-muted-foreground">{t("procurementMgmt.compliancePassed")}</p>
        </div>
      </div>

      {/* Without Contract */}
      {withoutContract.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-warning" />
            {isZh ? "待关联合同" : "Pending Contract Link"} ({withoutContract.length})
          </h3>
          <div className="space-y-3">
            {withoutContract.map(order => (
              <div key={order.id} className="glass-card rounded-xl p-4 border-l-4 border-l-warning">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-mono font-bold text-sm">{order.order_number}</span>
                    <span className="text-muted-foreground text-xs ml-2">{order.supplier_name}</span>
                  </div>
                  <span className="font-bold text-primary text-sm">¥{order.total_amount.toLocaleString()}</span>
                </div>
                {order.warranty_months && order.warranty_months > 0 && (
                  <p className="text-xs text-muted-foreground mb-2">{t("procurementMgmt.warrantyMonths")}: {order.warranty_months}</p>
                )}
                {editingId === order.id ? (
                  <div className="flex gap-2 mt-2">
                    <input value={contractNo} onChange={e => setContractNo(e.target.value)} placeholder={isZh ? "输入合同编号..." : "Enter contract number..."} className="text-xs border border-border rounded-md px-2 py-1 bg-card flex-1" />
                    <button onClick={() => handleLinkContract(order.id)} className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md">{t("common.confirm")}</button>
                    <button onClick={() => setEditingId(null)} className="px-3 py-1 text-xs text-muted-foreground">{t("common.cancel")}</button>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => { setEditingId(order.id); setContractNo(""); }} className="px-3 py-1 text-xs bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors flex items-center gap-1">
                      <FileText className="w-3 h-3" />{t("procurementMgmt.linkContract")}
                    </button>
                    {!order.compliance_checked && (
                      <button onClick={() => handleComplianceCheck(order.id, true)} className="px-3 py-1 text-xs bg-success/10 text-success rounded-md hover:bg-success/20 transition-colors flex items-center gap-1">
                        <Shield className="w-3 h-3" />{t("procurementMgmt.complianceCheck")}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* With Contract */}
      {withContract.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-success" />
            {isZh ? "已关联合同" : "Linked Contracts"} ({withContract.length})
          </h3>
          <div className="space-y-2">
            {withContract.map(order => (
              <div key={order.id} className="glass-card rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <span className="font-mono text-xs font-bold">{order.order_number}</span>
                    <span className="text-muted-foreground text-xs ml-2">{order.supplier_name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="px-2 py-0.5 bg-primary/10 text-primary rounded font-mono">{order.contract_number}</span>
                  {order.compliance_checked ? (
                    <ShieldCheck className="w-4 h-4 text-success" />
                  ) : (
                    <button onClick={() => handleComplianceCheck(order.id, true)} className="px-2 py-0.5 bg-warning/10 text-warning rounded text-[10px]">
                      {t("procurementMgmt.compliancePending")}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ProcurementContractTab;
