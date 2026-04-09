import { Navigate, Route, Routes } from 'react-router-dom';

import { AppShell } from './components/layout/AppShell.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ShellCanvasPage } from './pages/ShellCanvasPage.jsx';
import { flatNavigation } from './utils/appNavigation.js';

const App = () => (
  <ThemeProvider>
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/tickets" replace />} />
        {flatNavigation.map((item) => (
          <Route
            key={item.path}
            path={item.path}
            element={<ShellCanvasPage item={item} />}
          />
        ))}
        <Route path="*" element={<Navigate to="/tickets" replace />} />
      </Route>
    </Routes>
  </ThemeProvider>
);

export default App;
