import { Navigate, Route, Routes } from 'react-router-dom';

import { AppShell } from './components/layout/AppShell.jsx';
import { ProtectedRoute } from './components/primitives/ProtectedRoute.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { ShellCanvasPage } from './pages/ShellCanvasPage.jsx';
import TicketsPage from './pages/TicketsPage.jsx';
import { flatNavigation } from './utils/appNavigation.js';

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/tickets" replace />} />
            {flatNavigation.map((item) => (
              <Route
                key={item.path}
                path={item.path}
                element={item.path === '/tickets' ? <TicketsPage /> : <ShellCanvasPage item={item} />}
              />
            ))}
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/tickets" replace />} />
      </Routes>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
