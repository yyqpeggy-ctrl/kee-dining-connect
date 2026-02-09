import { ReactNode } from "react";
import AppSidebar from "./AppSidebar";

const AppLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-[220px] p-6">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
