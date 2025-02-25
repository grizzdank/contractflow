import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Contracts from "./pages/Contracts";
import ContractRequest from "./pages/ContractRequest";
import ContractApproval from "./pages/ContractApproval";
import ContractDetails from "./pages/ContractDetails";
import Team from "./pages/Team";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/Notifications";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/contracts" element={<Contracts />} />
        <Route path="/contracts/:contractNumber" element={<ContractDetails />} />
        <Route path="/request" element={<ContractRequest />} />
        <Route path="/approval" element={<ContractApproval />} />
        <Route path="/team" element={<Team />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
