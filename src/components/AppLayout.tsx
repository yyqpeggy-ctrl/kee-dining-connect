import { ReactNode } from "react";
import AppSidebar from "./AppSidebar";
import LanguageSwitcher from "./LanguageSwitcher";
import VoiceAssistant from "./VoiceAssistant";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      {/* Top bar */}
      <div className="ml-[220px] flex items-center justify-end gap-3 px-6 pt-4">
        {user && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isAdmin && (
              <Badge variant="outline" className="gap-1 text-[10px]">
                <Shield className="w-2.5 h-2.5" />Admin
              </Badge>
            )}
            <span className="truncate max-w-[180px]">{user.email}</span>
            <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={handleSignOut}>
              <LogOut className="w-3 h-3" />
            </Button>
          </div>
        )}
        <LanguageSwitcher />
      </div>
      <main className="ml-[220px] px-6 pb-6">
        {children}
      </main>
      <VoiceAssistant />
    </div>
  );
};

export default AppLayout;
