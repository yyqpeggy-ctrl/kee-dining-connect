import { ReactNode } from "react";
import AppSidebar from "./AppSidebar";
import LanguageSwitcher from "./LanguageSwitcher";

const AppLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      {/* Top bar with language switcher */}
      <div className="ml-[220px] flex justify-end px-6 pt-4">
        <LanguageSwitcher />
      </div>
      <main className="ml-[220px] px-6 pb-6">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
