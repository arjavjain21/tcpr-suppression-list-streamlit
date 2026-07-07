/**
 * Router Configuration
 * Creates and configures the application router with all routes
 */

import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import AppLayout from '../components/layout/AppLayout'
import Auth from '../components/Auth'
import IntakeForm from '../components/IntakeForm'
import Records from '../components/Records'
import Settings from '../components/Settings'
import Dashboard from '../components/Dashboard'
import Import from '../components/Import'
import Admin from '../components/Admin'

export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <Auth />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <Dashboard />,
          },
          {
            path: 'add-leads',
            element: <IntakeForm />,
          },
          {
            path: 'import',
            element: <Import />,
          },
          {
            path: 'records',
            element: <Records />,
          },
          {
            path: 'admin',
            element: <Admin />,
          },
          {
            path: 'settings',
            element: <Settings />,
          },
          {
            path: '*',
            element: (
              <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <h1 className="text-4xl font-bold text-gray-900">404</h1>
                <p className="text-gray-600">Page not found</p>
              </div>
            ),
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
])
