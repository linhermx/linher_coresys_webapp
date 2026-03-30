import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/layout/AppShell.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import InventoryPage from "./pages/InventoryPage.jsx";
import ServicesPage from "./pages/ServicesPage.jsx";
import SystemUiPage from "./pages/SystemUiPage.jsx";
import TelephonyPage from "./pages/TelephonyPage.jsx";
import TicketsPage from "./pages/TicketsPage.jsx";

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate replace to="/dashboard" />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/telephony" element={<TelephonyPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/system-ui" element={<SystemUiPage />} />
      </Route>
      <Route path="*" element={<Navigate replace to="/dashboard" />} />
    </Routes>
  );
}

export default App;
