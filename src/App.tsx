import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { StoreProvider } from "@/contexts/StoreContext";
import Index from "./pages/Index";
import Tables from "./pages/Tables";
import Inventory from "./pages/Inventory";
import Orders from "./pages/Orders";
import Kitchen from "./pages/Kitchen";
import Stores from "./pages/Stores";
import HR from "./pages/HR";
import Finance from "./pages/Finance";
import Legal from "./pages/Legal";
import Procurement from "./pages/Procurement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <StoreProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/tables" element={<Tables />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/kitchen" element={<Kitchen />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/procurement" element={<Procurement />} />
            <Route path="/stores" element={<Stores />} />
            <Route path="/hr" element={<HR />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </StoreProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
