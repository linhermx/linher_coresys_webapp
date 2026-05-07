import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth.js';
import { getFirstAccessiblePath } from '../../utils/appNavigation.js';
import { hasPermission } from '../../utils/accessControl.js';

export const ProtectedRoute = ({
  children = null,
  requiredPermission = ''
}) => {
  const location = useLocation();
  const { authUser, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    const from = `${location.pathname || '/tickets'}${location.search || ''}${location.hash || ''}`;

    return (
      <Navigate
        to="/login"
        replace
        state={{ from }}
      />
    );
  }

  if (!hasPermission(authUser, requiredPermission)) {
    return <Navigate to={getFirstAccessiblePath(authUser)} replace />;
  }

  return children || <Outlet />;
};
