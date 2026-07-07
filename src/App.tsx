/**
 * Main App Component
 * Professional navigation with authentication flow and React Router
 */

import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { NavigationProvider } from './contexts/NavigationContext'
import { ToastProvider } from './contexts/ToastContext'
import { router } from './router'

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <NavigationProvider>
          <RouterProvider router={router} />
        </NavigationProvider>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
