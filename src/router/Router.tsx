import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from 'react-router-dom';

import App from '../App';
import AreaProjects from '../pages/AreaProjects';
import AdminAreas from '../pages/AdminAreas';
import WorksBoard from '../pages/WorksBoard';
import WorkKanban from '../pages/WorkKanban';
import WorkKPIs from '../pages/WorkKPIs';
import Board from '../pages/Board';
import ArchivedBoard from '../pages/ArchivedBoard';
import ArchivedProjects from '../pages/ArchivedProjects';
import KPIs from '../pages/KPIs';
import Gantt from '../pages/Gantt';
import Login from '../pages/Login';
import AdminPanel from '../pages/AdminPanel';
import UserProfile from '../pages/UserProfile';
import { ProtectedRoute, LoginGuard, RoleHomeRedirect } from './Middleware';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />}>
      {/* Public */}
      <Route path="/login" element={<LoginGuard><Login /></LoginGuard>} />

      {/* All authenticated users */}
      <Route index element={<ProtectedRoute><RoleHomeRedirect /></ProtectedRoute>} />
      <Route path="/area" element={<ProtectedRoute><AreaProjects /></ProtectedRoute>} />
      <Route path="/works" element={<ProtectedRoute><WorksBoard /></ProtectedRoute>} />
      <Route path="/works/:workId/board" element={<ProtectedRoute><WorkKanban /></ProtectedRoute>} />
      <Route path="/works/:workId/kpis" element={<ProtectedRoute><WorkKPIs /></ProtectedRoute>} />
      <Route path="/archived" element={<ProtectedRoute><ArchivedProjects /></ProtectedRoute>} />
      <Route path="/board/:projectId" element={<ProtectedRoute><Board /></ProtectedRoute>} />
      <Route path="/archivedboard/:projectId" element={<ProtectedRoute><ArchivedBoard /></ProtectedRoute>} />
      <Route path="/kpis/:projectId" element={<ProtectedRoute><KPIs /></ProtectedRoute>} />
      <Route path="/gantt/:projectId" element={<ProtectedRoute><Gantt /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
      <Route path="/admin/areas" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminAreas /></ProtectedRoute>} />
      <Route path="/admin/areas/:unitId" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AreaProjects /></ProtectedRoute>} />
      <Route path="/admin/areas/:unitId/works" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><WorksBoard /></ProtectedRoute>} />
      <Route path="/admin/areas/:unitId/works/:workId/board" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><WorkKanban /></ProtectedRoute>} />
      <Route path="/admin/areas/:unitId/works/:workId/kpis" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><WorkKPIs /></ProtectedRoute>} />

      {/* Admin + Super Admin only */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
            <AdminPanel />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<ProtectedRoute><RoleHomeRedirect /></ProtectedRoute>} />
    </Route>
  )
);

const Router = () => <RouterProvider router={router} />;
export default Router;
