/**
 * AppLayout Component
 * Main layout wrapper with sidebar and content area
 */

import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import MobileNavigation from './MobileNavigation'

interface AppLayoutProps {}

export default function AppLayout({}: AppLayoutProps) {
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false)
  }

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
        {/* Sidebar - Desktop */}
        <div className="hidden lg:flex lg:fixed lg:h-screen lg:inset-y-0">
          <Sidebar />
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 lg:hidden"
            onClick={handleMobileMenuClose}
          >
            <div className="fixed inset-0 bg-gray-900 bg-opacity-50" />
            <div className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-xl">
              <Sidebar className="h-full" />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:ml-60">
          {/* Top Bar */}
          <TopBar
            onMobileMenuClick={() => setIsMobileMenuOpen(true)}
            className=""
          />

          {/* Page Content */}
          <main className="flex-1 p-4 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile Navigation - Fixed bottom bar */}
      <MobileNavigation />
    </>
  )
}
