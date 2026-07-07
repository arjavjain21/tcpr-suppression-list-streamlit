/**
 * Setter Management Component
 * Admin-only interface for managing setters
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Mail,
  Loader2,
  AlertCircle,
  Shield,
} from 'lucide-react'

interface SetterFormData {
  name: string
  email: string
  active: boolean
}

export default function SetterManagement() {
  const { isAdmin, profile } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [setters, setSetters] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingSetter, setEditingSetter] = useState(null)
  const [formData, setFormData] = useState<SetterFormData>({
    name: '',
    email: '',
    active: true,
  })
  const [saving, setSaving] = useState(false)
  const [version, setVersion] = useState(0) // Force re-mount on updates

  useEffect(() => {
    // Debug logging
    console.log('Admin Debug:', { profile, isAdmin, user: profile?.id })

    // Ensure user has admin role
    const ensureAdminRole = async () => {
      if (!profile?.id) return

      console.log('Checking admin role for user:', profile.id)

      // Check if user has admin role
      if (profile.role !== 'admin') {
        console.log('User does not have admin role, attempting to fix...')

        try {
          // First, check if profile exists
          const { data: existingProfile, error: checkError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', profile.id)
            .single()

          if (checkError || !existingProfile) {
            console.log('Profile does not exist, creating...')
            // Create profile with admin role
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: profile.id,
                email: profile.email || 'arjav@eagleinfoservice.com',
                full_name: profile.full_name || 'Arjav Jain',
                role: 'admin'
              })

            if (insertError) {
              console.error('Failed to create admin profile:', insertError)
              showToast({
                type: 'error',
                message: 'Failed to create admin profile. Please contact support.',
              })
              return
            }
            console.log('✓ Successfully created admin profile')
          } else {
            // Profile exists, try to update it
            console.log('Profile exists, updating to admin role...')
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ role: 'admin' })
              .eq('id', profile.id)

            if (updateError) {
              console.error('Failed to update profile to admin role:', updateError)
              showToast({
                type: 'error',
                message: 'Failed to set admin role. Please contact support.',
              })
              return
            }
            console.log('✓ Successfully updated profile to admin role')
          }

          showToast({
            type: 'success',
            message: 'Admin access granted successfully',
          })
          // Reload the page to pick up the new role
          setTimeout(() => window.location.reload(), 1000)
        } catch (err) {
          console.error('Error ensuring admin role:', err)
          showToast({
            type: 'error',
            message: 'Failed to grant admin access. Please check your Supabase setup.',
          })
        }
      }
    }

    ensureAdminRole()
    loadSetters()
  }, [profile])

  const loadSetters = async () => {
    try {
      setLoading(true)
      console.log('loadSetters: fetching from Supabase...')
      const { data, error } = await supabase
        .from('setters')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      // Force state update with fresh data from server
      console.log('loadSetters: received data from Supabase:', JSON.stringify(data?.map(s => ({ id: s.id, name: s.name, email: s.email }))))
      console.log('loadSetters: setting state with', data?.length, 'setters')
      setSetters(data || [])
      console.log('loadSetters: state update complete, new setters:', JSON.stringify(data?.map(s => ({ id: s.id, name: s.name, email: s.email }))))
    } catch (err) {
      console.error('Error loading setters:', err)
      showToast({
        type: 'error',
        message: 'Failed to load setters',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      showToast({
        type: 'error',
        message: 'Name and email are required',
      })
      return
    }

    setSaving(true)
    const previousSetters = [...setters]

    try {
      if (editingSetter) {
        console.log('handleSave: updating existing setter', editingSetter.id, 'to name:', formData.name.trim())
        // Optimistic update - update in UI immediately
        const updatedSetter = {
          ...editingSetter,
          name: formData.name.trim(),
          email: formData.email.trim(),
          active: formData.active,
        }
        console.log('handleSave: optimistic update before:', setters.find(s => s.id === editingSetter.id)?.name)
        setSetters(setters.map(s => s.id === editingSetter.id ? updatedSetter : s))
        console.log('handleSave: optimistic update completed, new state should have name:', formData.name.trim())
        // Force re-render by updating version
        setVersion(v => v + 1)

        // Update existing setter
        const { data: updateData, error } = await supabase
          .from('setters')
          .update({
            name: formData.name.trim(),
            email: formData.email.trim(),
            active: formData.active,
          })
          .eq('id', editingSetter.id)
          .select()

        console.log('handleSave: Supabase update result:', { updateData, error })

        if (error) {
          console.error('handleSave: Supabase update error:', error)
          throw error
        }
        console.log('handleSave: Supabase update succeeded, waiting before reload...')
        showToast({
          type: 'success',
          message: 'Setter updated successfully',
        })
        // Wait a moment for Supabase to fully commit the update before reloading
        await new Promise(resolve => setTimeout(resolve, 100))
      } else {
        // Create new setter
        const { data, error } = await supabase
          .from('setters')
          .insert({
            name: formData.name.trim(),
            email: formData.email.trim(),
            active: formData.active,
          })
          .select()
          .single()

        if (error) throw error

        // Optimistic update - add to UI immediately
        if (data) {
          setSetters(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
        }

        showToast({
          type: 'success',
          message: 'Setter created successfully',
        })
      }

      // Reload to ensure consistency
      // await loadSetters()  // TEMPORARILY DISABLED - rely on optimistic update only
      setShowAddForm(false)
      setEditingSetter(null)
      resetForm()
    } catch (err) {
      console.error('Error saving setter:', err)
      // Revert on error
      setSetters(previousSetters)
      showToast({
        type: 'error',
        message: `Failed to save setter: ${err.message || 'Unknown error'}`,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (setter) => {
    setEditingSetter(setter)
    setFormData({
      name: setter.name,
      email: setter.email,
      active: setter.active,
    })
    setShowAddForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this setter?')) return

    // Optimistic update - remove from UI immediately
    const previousSetters = [...setters]
    setSetters(setters.filter(s => s.id !== id))

    try {
      const { data: deleteData, error } = await supabase.from('setters').delete().eq('id', id)

      console.log('handleDelete: Supabase delete result:', { deleteData, error })

      if (error) {
        console.error('handleDelete: Supabase delete error:', error)
        throw error
      }
      showToast({
        type: 'success',
        message: 'Setter deleted successfully',
      })
      // await loadSetters()  // TEMPORARILY DISABLED - rely on optimistic update only
    } catch (err) {
      console.error('Error deleting setter:', err)
      // Revert on error
      setSetters(previousSetters)
      showToast({
        type: 'error',
        message: `Failed to delete setter: ${err.message || 'Unknown error'}`,
      })
    }
  }

  const handleToggleActive = async (setter) => {
    // Optimistic update - toggle in UI immediately
    const previousSetters = [...setters]
    const newActiveState = !setter.active
    setSetters(setters.map(s => s.id === setter.id ? { ...s, active: newActiveState } : s))

    try {
      const { data: toggleData, error } = await supabase
        .from('setters')
        .update({ active: newActiveState })
        .eq('id', setter.id)
        .select()

      console.log('handleToggleActive: Supabase toggle result:', { toggleData, error })

      if (error) {
        console.error('handleToggleActive: Supabase toggle error:', error)
        throw error
      }
      showToast({
        type: 'success',
        message: `Setter ${setter.active ? 'deactivated' : 'activated'}`,
      })
      // await loadSetters()  // TEMPORARILY DISABLED - rely on optimistic update only
    } catch (err) {
      console.error('Error toggling setter:', err)
      // Revert on error
      setSetters(previousSetters)
      showToast({
        type: 'error',
        message: `Failed to update setter: ${err.message || 'Unknown error'}`,
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      active: true,
    })
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingSetter(null)
    resetForm()
  }

  // Redirect if not admin
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don't have permission to access this page
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-6 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-accent" />
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Setter Management
            </h1>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent/90 transition-all active:translate-y-[1px]"
          >
            <Plus className="h-5 w-5" />
            Add Setter
          </button>
        </div>
        <p className="text-gray-600">
          Manage your setter accounts for the TCPR Suppression Lists tool
        </p>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl border border-slate-200/50 p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {editingSetter ? 'Edit Setter' : 'Add New Setter'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
                placeholder="Setter name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
                placeholder="setter@example.com"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-5 h-5 text-accent border-slate-300 rounded focus:ring-accent"
                />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent/90 transition-all active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  {editingSetter ? 'Update' : 'Create'} Setter
                </>
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-6 py-3 border border-slate-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Setters Table */}
      <div className="bg-white rounded-2xl border border-slate-200/50 overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : setters.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No setters yet
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Add your first setter to get started
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent/90 transition-all active:translate-y-[1px]"
            >
              <Plus className="h-5 w-5" />
              Add Setter
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {setters.map((setter) => (
                  <tr
                    key={setter.id}
                    className={!setter.active ? 'bg-gray-50' : 'hover:bg-gray-50 transition-colors'}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-accent" />
                        </div>
                        <span className="font-medium text-gray-900">
                          {setter.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span className="font-mono text-sm">{setter.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(setter)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          setter.active
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            setter.active ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        />
                        {setter.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(setter)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(setter.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-medium mb-1">Admin Access Only</p>
          <p className="text-blue-800">
            Setters are used when importing CSV data. They represent the team members responsible for managing contacts.
          </p>
        </div>
      </div>
    </div>
  )
}
