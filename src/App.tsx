import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Contracts from "./pages/Contracts";
import NotFound from "./pages/NotFound";
import Pricing from "./pages/Pricing";
import Team from "./pages/Team";
import Notifications from "./pages/Notifications";
import ContractDetail from "./pages/ContractDetail";
import ContractRequest from "./pages/ContractRequest";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public landing page */}
        <Route path="/" element={<Index />} />
        <Route path="/pricing" element={<Pricing />} />
        
        {/* Demo routes */}
        <Route path="/demo">
          <Route path="contracts" element={<Contracts />} />
          <Route path="contracts/:contractNumber" element={<ContractDetail />} />
          <Route path="contract-request" element={<ContractRequest />} />
          <Route path="team" element={<Team />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>
        
        {/* Catch-all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
