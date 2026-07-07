/**
 * Sidebar Component
 * Left navigation sidebar with collapsible functionality
 */

import { Link, useLocation } from 'react-router-dom'
import { useNavigation } from '../../contexts/NavigationContext'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard,
  PlusCircle,
  Database,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
  Upload,
  Shield,
} from 'lucide-react'

const iconMap = {
  LayoutDashboard,
  PlusCircle,
  Database,
  BarChart3,
  Settings,
  Activity,
  Upload,
  Shield,
}

interface SidebarProps {
  className?: string
}

export default function Sidebar({ className = '' }: SidebarProps) {
  const location = useLocation()
  const { navigationItems, isSidebarCollapsed, toggleSidebar } = useNavigation()
  const { isAdmin } = useAuth()

  // Filter navigation items based on admin role
  const visibleItems = navigationItems.filter(
    (item) => !item.adminOnly || isAdmin
  )

  return (
    <aside
      className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-200 ${
        isSidebarCollapsed ? 'w-16' : 'w-60'
      } ${className}`}
    >
      {/* Logo Section */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200">
        {!isSidebarCollapsed && (
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-accent" />
            <span className="font-semibold text-gray-900">TCPR Tool</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = iconMap[item.icon as keyof typeof iconMap]

          if (item.disabled) {
            return (
              <button
                key={item.id}
                disabled
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 cursor-not-allowed transition-all duration-150`}
                aria-label={item.label}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isSidebarCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
                {item.disabled && isSidebarCollapsed && (
                  <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Coming soon
                  </span>
                )}
              </button>
            )
          }

          return (
            <Link
              key={item.id}
              to={item.path}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative ${
                isActive
                  ? 'bg-accent-light text-accent'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active Indicator */}
              <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 rounded-r-full transition-all duration-150 ${
                isActive ? 'bg-primary' : 'bg-transparent'
              }`} />

              {/* Icon */}
              <Icon className="h-5 w-5 flex-shrink-0" />

              {/* Label */}
              {!isSidebarCollapsed && (
                <span className="truncate">{item.label}</span>
              )}

              {/* Badge */}
              {!isSidebarCollapsed && item.badge && item.badge > 0 && (
                <span className="ml-auto bg-accent-light text-accent text-xs font-medium px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer Section */}
      <div className="p-4 border-t border-gray-200">
        {!isSidebarCollapsed && (
          <p className="text-xs text-gray-500">v1.0.0</p>
        )}
      </div>
    </aside>
  )
}
