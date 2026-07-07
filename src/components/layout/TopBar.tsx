/**
 * TopBar Component
 * Top navigation bar with logo and user menu
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { LogOut, User, Menu, ChevronDown, Shield } from 'lucide-react'

interface TopBarProps {
  onMobileMenuClick: () => void
  className?: string
}

export default function TopBar({ onMobileMenuClick, className = '' }: TopBarProps) {
  const { signOut, user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = async () => {
    await signOut()
    setShowUserMenu(false)
  }

  const handleAdminClick = () => {
    navigate('/admin')
    setShowUserMenu(false)
  }

  return (
    <header className={`h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 ${className}`}>
      {/* Left: Mobile menu + Breadcrumbs */}
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onMobileMenuClick}
          className="lg:hidden p-2 rounded hover:bg-gray-100 text-gray-600"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Breadcrumbs removed - now handled by React Router */}
      </div>

      {/* Right: User menu */}
      <div className="flex items-center gap-3">
        {user && (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 sm:gap-3 px-3 py-2 hover:bg-gray-100 rounded-xl transition-colors"
              aria-label="User menu"
            >
              <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
                <User className="h-4 w-4 text-accent" />
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm text-gray-700">{user.email}</span>
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/10 rounded-full">
                    <Shield className="h-3 w-3 text-accent" />
                    <span className="text-xs font-medium text-accent">Admin</span>
                  </span>
                )}
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-lg py-2 z-50">
                {isAdmin && (
                  <>
                    <button
                      onClick={handleAdminClick}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Shield className="h-4 w-4 text-accent" />
                      Admin Panel
                    </button>
                    <div className="h-px bg-slate-200 my-1" />
                  </>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <LogOut className="h-4 w-4 text-gray-600" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
