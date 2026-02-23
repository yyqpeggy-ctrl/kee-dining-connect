import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, MapPin, Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface Store {
  id: string;
  name: string;
  nameEn: string;
  address: string;
  status: "online" | "offline" | "hq";
}

export const stores: Store[] = [
  { id: "all", name: "总部（合并视图）", nameEn: "HQ (Consolidated)", address: "集团总部", status: "hq" },
  { id: "flagship", name: "旗舰店", nameEn: "Flagship - The Bund", address: "上海市黄浦区外滩18号", status: "online" },
  { id: "french", name: "法租界店", nameEn: "French Concession", address: "上海市徐汇区永康路68号", status: "online" },
  { id: "jingan", name: "静安店", nameEn: "Jing'an", address: "上海市静安区巨鹿路158号", status: "online" },
  { id: "xintiandi", name: "新天地店", nameEn: "Xintiandi", address: "上海市黄浦区太仓路181弄", status: "offline" },
];

interface StoreSelectorProps {
  currentStore: Store;
  onStoreChange: (store: Store) => void;
}

const StoreSelector = ({ currentStore, onStoreChange }: StoreSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { i18n } = useTranslation();
  const isZh = i18n.language === 'zh';

  const getStoreName = (store: Store) => isZh ? store.name : store.nameEn;
  const isHQ = currentStore.id === "all";

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors w-full"
      >
        <div className={`w-7 h-7 rounded-md flex items-center justify-center ${isHQ ? "bg-warning/15" : "bg-primary/15"}`}>
          {isHQ ? <Building2 className="w-3.5 h-3.5 text-warning" /> : <MapPin className="w-3.5 h-3.5 text-primary" />}
        </div>
        <div className="flex-1 text-left">
          <p className="text-xs font-medium text-foreground">{getStoreName(currentStore)}</p>
          <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{currentStore.address}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-full mt-1 z-50 bg-card border border-border rounded-lg shadow-lg overflow-hidden"
            >
              {stores.map((store, idx) => (
                <div key={store.id}>
                  {idx === 1 && <div className="border-t border-border/50" />}
                  <button
                    onClick={() => {
                      onStoreChange(store);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {store.id === "all" ? (
                          <Building2 className="w-3 h-3 text-warning" />
                        ) : null}
                        <span className="text-xs font-medium">{getStoreName(store)}</span>
                        {store.status === "online" && <span className="w-1.5 h-1.5 rounded-full bg-success" />}
                        {store.status === "offline" && <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />}
                        {store.status === "hq" && <span className="w-1.5 h-1.5 rounded-full bg-warning" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground">{store.address}</p>
                    </div>
                    {currentStore.id === store.id && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </button>
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StoreSelector;
