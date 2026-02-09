import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, MapPin } from "lucide-react";

export interface Store {
  id: string;
  name: string;
  address: string;
  status: "online" | "offline";
}

export const stores: Store[] = [
  { id: "1", name: "总店", address: "朝阳区建国路88号", status: "online" },
  { id: "2", name: "国贸分店", address: "朝阳区国贸中心B座", status: "online" },
  { id: "3", name: "三里屯分店", address: "朝阳区三里屯路19号", status: "online" },
  { id: "4", name: "望京分店", address: "朝阳区望京SOHO", status: "offline" },
];

interface StoreSelectorProps {
  currentStore: Store;
  onStoreChange: (store: Store) => void;
}

const StoreSelector = ({ currentStore, onStoreChange }: StoreSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors w-full"
      >
        <div className="w-7 h-7 rounded-md bg-primary/15 flex items-center justify-center">
          <MapPin className="w-3.5 h-3.5 text-primary" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-xs font-medium text-foreground">{currentStore.name}</p>
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
              {stores.map((store) => (
                <button
                  key={store.id}
                  onClick={() => {
                    onStoreChange(store);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{store.name}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${store.status === "online" ? "bg-success" : "bg-muted-foreground"}`} />
                    </div>
                    <p className="text-[10px] text-muted-foreground">{store.address}</p>
                  </div>
                  {currentStore.id === store.id && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StoreSelector;
