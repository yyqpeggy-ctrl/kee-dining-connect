import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { StoreProvider } from "@/contexts/StoreContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Index from "./pages/Index";
import Tables from "./pages/Tables";
import Inventory from "./pages/Inventory";
import Orders from "./pages/Orders";
import Kitchen from "./pages/Kitchen";
import Delivery from "./pages/Delivery";
import Stores from "./pages/Stores";
import HR from "./pages/HR";
import Finance from "./pages/Finance";
import Legal from "./pages/Legal";
import Procurement from "./pages/Procurement";
import Marketing from "./pages/Marketing";
// CustomerAnalysis moved into Marketing as a tab
import Menu from "./pages/Menu";
import DataCenter from "./pages/DataCenter";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <StoreProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/tables" element={<ProtectedRoute><Tables /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
              <Route path="/kitchen" element={<ProtectedRoute><Kitchen /></ProtectedRoute>} />
              <Route path="/delivery" element={<ProtectedRoute><Delivery /></ProtectedRoute>} />
              <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
              <Route path="/procurement" element={<ProtectedRoute><Procurement /></ProtectedRoute>} />
              <Route path="/stores" element={<ProtectedRoute><Stores /></ProtectedRoute>} />
              <Route path="/hr" element={<ProtectedRoute><HR /></ProtectedRoute>} />
              <Route path="/finance" element={<ProtectedRoute><Finance /></ProtectedRoute>} />
              <Route path="/legal" element={<ProtectedRoute><Legal /></ProtectedRoute>} />
              <Route path="/marketing" element={<ProtectedRoute><Marketing /></ProtectedRoute>} />
              <Route path="/customers" element={<ProtectedRoute><Marketing /></ProtectedRoute>} />
              <Route path="/menu" element={<ProtectedRoute><Menu /></ProtectedRoute>} />
              <Route path="/data-center" element={<ProtectedRoute><DataCenter /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </StoreProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
