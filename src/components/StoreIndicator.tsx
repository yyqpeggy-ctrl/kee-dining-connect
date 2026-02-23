import { Building2, Store } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { useTranslation } from "react-i18next";

/** A small banner showing which store/entity the current view belongs to */
const StoreIndicator = () => {
  const { currentStore, isHQ } = useStore();
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const name = isZh ? currentStore.name : currentStore.nameEn;

  if (isHQ) {
    return (
      <div className="bg-warning/10 border border-warning/20 rounded-lg px-4 py-2 text-sm flex items-center gap-2 mb-4">
        <Building2 className="w-4 h-4 text-warning" />
        <span className="text-warning font-medium">{isZh ? "总部合并视图" : "HQ Consolidated View"}</span>
        <span className="text-muted-foreground">— {isZh ? "查看所有子公司汇总数据" : "Viewing all subsidiary data"}</span>
      </div>
    );
  }

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-2 text-sm flex items-center gap-2 mb-4">
      <Store className="w-4 h-4 text-primary" />
      <span className="font-medium">{name}</span>
      <span className="text-muted-foreground">— {isZh ? "独立法人实体" : "Independent Legal Entity"}</span>
    </div>
  );
};

export default StoreIndicator;
