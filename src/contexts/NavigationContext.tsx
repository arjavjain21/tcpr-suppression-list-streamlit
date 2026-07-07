/**
 * Navigation Context
 * Manages navigation state and sidebar collapse state
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface NavigationItem {
  id: string
  label: string
  icon: string
  path: string
  badge?: number
  disabled?: boolean
  adminOnly?: boolean
}

interface NavigationContextType {
  navigationItems: NavigationItem[]
  isSidebarCollapsed: boolean
  toggleSidebar: () => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

const NAVIGATION_ITEMS: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/dashboard' },
  { id: 'add-leads', label: 'Add Leads', icon: 'PlusCircle', path: '/add-leads' },
  { id: 'import', label: 'CSV Import', icon: 'Upload', path: '/import' },
  { id: 'records', label: 'Records', icon: 'Database', path: '/records' },
  { id: 'analytics', label: 'Analytics', icon: 'BarChart3', path: '/analytics', disabled: true },
  { id: 'admin', label: 'Admin', icon: 'Settings', path: '/admin', adminOnly: true },
  { id: 'settings', label: 'Settings', icon: 'Settings', path: '/settings' },
]

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const newValue = !prev
      localStorage.setItem('sidebarCollapsed', String(newValue))
      return newValue
    })
  }

  // Load sidebar state
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebarCollapsed')
    if (savedCollapsed === 'true') {
      setIsSidebarCollapsed(true)
    }
  }, [])

  return (
    <NavigationContext.Provider
      value={{
        navigationItems: NAVIGATION_ITEMS,
        isSidebarCollapsed,
        toggleSidebar,
      }}
    >
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider')
  }
  return context
}
