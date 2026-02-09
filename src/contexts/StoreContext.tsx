import { createContext, useContext, useState, ReactNode } from "react";
import { Store, stores } from "@/components/StoreSelector";

interface StoreContextType {
  currentStore: Store;
  setCurrentStore: (store: Store) => void;
  allStores: Store[];
}

const StoreContext = createContext<StoreContextType | null>(null);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [currentStore, setCurrentStore] = useState<Store>(stores[0]);

  return (
    <StoreContext.Provider value={{ currentStore, setCurrentStore, allStores: stores }}>
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
