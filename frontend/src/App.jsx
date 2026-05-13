import { Navigate, Route, Routes } from 'react-router-dom';

import { AppShell } from './components/layout/AppShell.jsx';
import { ProtectedRoute } from './components/primitives/ProtectedRoute.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { useAuth } from './hooks/useAuth.js';
import AccessPage from './pages/AccessPage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { ShellCanvasPage } from './pages/ShellCanvasPage.jsx';
import TicketsPage from './pages/TicketsPage.jsx';
import { flatNavigation, getFirstAccessiblePath } from './utils/appNavigation.js';

const renderWorkspaceRoute = (item) => (
  item.path === '/tickets'
    ? <TicketsPage />
    : item.path === '/inventory'
      ? <InventoryPage />
      : item.path === '/access'
        ? <AccessPage />
      : <ShellCanvasPage item={item} />
);

const AppRoutes = () => {
  const { authUser } = useAuth();
  const firstAccessiblePath = getFirstAccessiblePath(authUser);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to={firstAccessiblePath} replace />} />

          {flatNavigation.map((item) => (
            <Route
              key={item.path}
              path={item.path}
              element={(
                <ProtectedRoute requiredPermission={item.requiredPermission}>
                  {renderWorkspaceRoute(item)}
                </ProtectedRoute>
              )}
            />
          ))}
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={firstAccessiblePath} replace />} />
    </Routes>
  );
};

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </ThemeProvider>
);

export default App;
