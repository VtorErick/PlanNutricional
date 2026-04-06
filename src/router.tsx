import { RouteObject, Navigate } from 'react-router';
import App from './App';
import { LandingPage } from './pages/LandingPage';
import { PlanPage } from './pages/PlanPage';
import { EquivalenciasPage } from './pages/EquivalenciasPage';
import { ResumenPage } from './pages/ResumenPage';
import { ComprasPage } from './pages/ComprasPage';
import { AdminPage } from './pages/AdminPage';
import { GeneratePage } from './pages/GeneratePage';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'plan', element: <PlanPage /> },
      { path: 'equivalencias', element: <EquivalenciasPage /> },
      { path: 'resumen', element: <ResumenPage /> },
      { path: 'compras', element: <ComprasPage /> },
      { path: 'admin', element: <AdminPage /> },
      { path: 'generate', element: <GeneratePage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
];
