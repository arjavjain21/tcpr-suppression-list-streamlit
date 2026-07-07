/**
 * MobileNavigation Component
 * Bottom navigation bar for mobile devices
 */

import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, PlusCircle, Database, Upload } from 'lucide-react'

export default function MobileNavigation() {
  const location = useLocation()

  const mobileItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'add-leads', label: 'Add', icon: PlusCircle, path: '/add-leads' },
    { id: 'import', label: 'Import', icon: Upload, path: '/import' },
    { id: 'records', label: 'Records', icon: Database, path: '/records' },
  ]

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {mobileItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon

          return (
            <Link
              key={item.id}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 gap-1 transition-colors ${
                isActive ? 'text-accent' : 'text-gray-500'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
