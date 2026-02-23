import { createContext, useContext, useState, ReactNode } from "react";
import { Store, stores } from "@/components/StoreSelector";

interface StoreContextType {
  currentStore: Store;
  setCurrentStore: (store: Store) => void;
  allStores: Store[];
  isHQ: boolean;
  /** Convenience: the store id string */
  storeId: string;
  /** Store display name (respects language via the store object) */
  storeName: (isZh: boolean) => string;
}

const StoreContext = createContext<StoreContextType | null>(null);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [currentStore, setCurrentStore] = useState<Store>(stores[0]);

  const isHQ = currentStore.id === "all";
  const storeId = currentStore.id;
  const storeName = (isZh: boolean) => isZh ? currentStore.name : currentStore.nameEn;

  return (
    <StoreContext.Provider value={{ currentStore, setCurrentStore, allStores: stores, isHQ, storeId, storeName }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within StoreProvider");
  }
  return context;
};
