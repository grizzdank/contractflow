
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ContractRequest from "./pages/ContractRequest";
import ContractApproval from "./pages/ContractApproval";
import Contracts from "./pages/Contracts";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ProtectedLayout from "./components/ProtectedLayout";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/request"
          element={
            <ProtectedLayout>
              <ContractRequest />
            </ProtectedLayout>
          }
        />
        <Route
          path="/approval"
          element={
            <ProtectedLayout>
              <ContractApproval />
            </ProtectedLayout>
          }
        />
        <Route
          path="/contracts"
          element={
            <ProtectedLayout>
              <Contracts />
            </ProtectedLayout>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
