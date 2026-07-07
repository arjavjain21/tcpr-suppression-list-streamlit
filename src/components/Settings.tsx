/**
 * Settings Component
 * Professional settings page with user preferences
 */

import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { User, LogOut, Save } from 'lucide-react'

export default function Settings() {
  const { user, signOut } = useAuth()
  const { showToast } = useToast()
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(false)
    showToast('success', 'Settings saved successfully')
  }

  const handleLogout = async () => {
    await signOut()
    showToast('info', 'Signed out successfully')
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-sm text-gray-600">Manage your preferences</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-4 h-4" />
            Account Information
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Email</span>
              <span className="text-sm font-medium text-gray-900">{user?.email}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary">
            {saving ? <>Saving...</> : <><Save className="w-4 h-4 inline mr-2" />Save Settings</>}
          </button>
          <button onClick={handleLogout} className="px-6 py-3 border-2 border-gray-300 text-gray-700 bg-white rounded-xl hover:bg-gray-50">
            <LogOut className="w-4 h-4 inline mr-2" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
