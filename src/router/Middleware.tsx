import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../store/useAuth';
import type { UserRole } from '../types';

interface Props {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export const getDefaultRouteForRole = (role: UserRole) => {
  return role === 'user' ? '/area' : '/admin/areas';
};

/**
 * Redirects to /login if the user is not authenticated.
 * Optionally restricts access to specific roles.
 */
export const ProtectedRoute = ({ children, allowedRoles }: Props) => {
  const { token, user } = useAuth();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
  }

  return <>{children}</>;
};

/**
 * Redirects authenticated users away from the login page.
 */
export const LoginGuard = ({ children }: { children: ReactNode }) => {
  const token = useAuth((s) => s.token);
  const user = useAuth((s) => s.user);

  if (token && user) {
    return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
  }

  return <>{children}</>;
};

export const RoleHomeRedirect = () => {
  const user = useAuth((s) => s.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
};
