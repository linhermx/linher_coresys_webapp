import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/layout/AppShell.jsx";
import AccessPage from "./pages/AccessPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import InfrastructurePage from "./pages/InfrastructurePage.jsx";
import InventoryPage from "./pages/InventoryPage.jsx";
import ServicesPage from "./pages/ServicesPage.jsx";
import SystemUiPage from "./pages/SystemUiPage.jsx";
import TelephonyPage from "./pages/TelephonyPage.jsx";
import TicketsPage from "./pages/TicketsPage.jsx";
import { APP_METADATA } from "./utils/app.js";

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate replace to={APP_METADATA.homePath} />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/telephony" element={<TelephonyPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/access" element={<AccessPage />} />
        <Route path="/infrastructure" element={<InfrastructurePage />} />
        <Route path="/system-ui" element={<SystemUiPage />} />
      </Route>
      <Route path="*" element={<Navigate replace to={APP_METADATA.homePath} />} />
    </Routes>
  );
}

export default App;
