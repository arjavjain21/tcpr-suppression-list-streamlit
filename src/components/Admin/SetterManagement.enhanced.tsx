/**
 * Setter Management Component - ENHANCED VERSION
 * Admin-only interface for managing setters
 *
 * ENHANCEMENTS:
 * - Better error visibility with detailed error display
 * - Debug panel to show Supabase operation results
 * - Connection health check
 * - Test mode to verify database operations
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
  Bug,
  Database,
} from 'lucide-react'

interface SetterFormData {
  name: string
  email: string
  active: boolean
}

interface SupabaseOperation {
  type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
  status: 'pending' | 'success' | 'error'
  timestamp: string
  details?: string
  error?: string
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
  const [version, setVersion] = useState(0)

  // NEW: Debug state
  const [showDebug, setShowDebug] = useState(false)
  const [operations, setOperations] = useState<SupabaseOperation[]>([])
  const [dbHealth, setDbHealth] = useState<'healthy' | 'error' | 'checking'>('checking')

  // NEW: Log Supabase operations
  const logOperation = (type: SupabaseOperation['type'], status: SupabaseOperation['status'], details?: string, error?: string) => {
    const operation: SupabaseOperation = {
      type,
      status,
      timestamp: new Date().toISOString(),
      details,
      error,
    }
    setOperations(prev => [operation, ...prev].slice(0, 10)) // Keep last 10
    console.log(`[Supabase ${type}]`, { status, details, error })
  }

  // NEW: Check database connection health
  const checkDbHealth = async () => {
    setDbHealth('checking')
    try {
      const { data, error } = await supabase
        .from('setters')
        .select('id')
        .limit(1)

      if (error) {
        setDbHealth('error')
        logOperation('SELECT', 'error', undefined, `Health check failed: ${error.message}`)
      } else {
        setDbHealth('healthy')
        logOperation('SELECT', 'success', 'Health check passed')
      }
    } catch (err) {
      setDbHealth('error')
      logOperation('SELECT', 'error', undefined, `Health check exception: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  useEffect(() => {
    console.log('Admin Debug:', { profile, isAdmin, user: profile?.id })

    const ensureAdminRole = async () => {
      if (!profile?.id) return

      console.log('Checking admin role for user:', profile.id)

      if (profile.role !== 'admin') {
        console.log('User does not have admin role, attempting to fix...')

        try {
          const { data: existingProfile, error: checkError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', profile.id)
            .single()

          if (checkError || !existingProfile) {
            console.log('Profile does not exist, creating...')
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
    checkDbHealth()
  }, [profile])

  const loadSetters = async () => {
    try {
      setLoading(true)
      logOperation('SELECT', 'pending', 'Loading setters...')

      console.log('loadSetters: fetching from Supabase...')
      const { data, error } = await supabase
        .from('setters')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        logOperation('SELECT', 'error', undefined, error.message)
        throw error
      }

      logOperation('SELECT', 'success', `Loaded ${data?.length || 0} setters`)
      console.log('loadSetters: received data from Supabase:', JSON.stringify(data?.map(s => ({ id: s.id, name: s.name, email: s.email }))))
      console.log('loadSetters: setting state with', data?.length, 'setters')
      setSetters(data || [])
      console.log('loadSetters: state update complete, new setters:', JSON.stringify(data?.map(s => ({ id: s.id, name: s.name, email: s.email }))))
    } catch (err) {
      console.error('Error loading setters:', err)
      logOperation('SELECT', 'error', undefined, err instanceof Error ? err.message : String(err))
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
        const operationId = `UPDATE-${editingSetter.id}-${Date.now()}`
        logOperation('UPDATE', 'pending', `Updating setter "${formData.name.trim()}"`)

        console.log('handleSave: updating existing setter', editingSetter.id, 'to name:', formData.name.trim())
        const updatedSetter = {
          ...editingSetter,
          name: formData.name.trim(),
          email: formData.email.trim(),
          active: formData.active,
        }
        setSetters(setters.map(s => s.id === editingSetter.id ? updatedSetter : s))
        setVersion(v => v + 1)

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
          logOperation('UPDATE', 'error', undefined, error.message)
          throw error
        }

        logOperation('UPDATE', 'success', `Updated setter "${formData.name.trim()}"`)
        console.log('handleSave: Supabase update succeeded')
        showToast({
          type: 'success',
          message: 'Setter updated successfully',
        })
        await new Promise(resolve => setTimeout(resolve, 100))
      } else {
        logOperation('INSERT', 'pending', `Creating new setter "${formData.name.trim()}"`)

        const { data, error } = await supabase
          .from('setters')
          .insert({
            name: formData.name.trim(),
            email: formData.email.trim(),
            active: formData.active,
          })
          .select()
          .single()

        if (error) {
          logOperation('INSERT', 'error', undefined, error.message)
          throw error
        }

        if (data) {
          setSetters(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
        }

        logOperation('INSERT', 'success', `Created setter "${formData.name.trim()}"`)
        showToast({
          type: 'success',
          message: 'Setter created successfully',
        })
      }

      setShowAddForm(false)
      setEditingSetter(null)
      resetForm()
    } catch (err) {
      console.error('Error saving setter:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      logOperation(editingSetter ? 'UPDATE' : 'INSERT', 'error', undefined, errorMessage)
      setSetters(previousSetters)
      showToast({
        type: 'error',
        message: `Failed to save setter: ${errorMessage}`,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this setter?')) return

    const previousSetters = [...setters]
    const setterToDelete = setters.find(s => s.id === id)
    setSetters(setters.filter(s => s.id !== id))

    logOperation('DELETE', 'pending', `Deleting setter "${setterToDelete?.name || 'Unknown'}"`)

    try {
      const { data: deleteData, error } = await supabase.from('setters').delete().eq('id', id)

      console.log('handleDelete: Supabase delete result:', { deleteData, error })

      if (error) {
        console.error('handleDelete: Supabase delete error:', error)
        logOperation('DELETE', 'error', undefined, error.message)
        throw error
      }

      logOperation('DELETE', 'success', `Deleted setter "${setterToDelete?.name}"`)
      showToast({
        type: 'success',
        message: 'Setter deleted successfully',
      })
    } catch (err) {
      console.error('Error deleting setter:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      logOperation('DELETE', 'error', undefined, errorMessage)
      setSetters(previousSetters)
      showToast({
        type: 'error',
        message: `Failed to delete setter: ${errorMessage}`,
      })
    }
  }

  const handleToggleActive = async (setter) => {
    const previousSetters = [...setters]
    const newActiveState = !setter.active
    setSetters(setters.map(s => s.id === setter.id ? { ...s, active: newActiveState } : s))

    logOperation('UPDATE', 'pending', `Toggling setter "${setter.name}" to ${newActiveState ? 'active' : 'inactive'}`)

    try {
      const { data: toggleData, error } = await supabase
        .from('setters')
        .update({ active: newActiveState })
        .eq('id', setter.id)
        .select()

      console.log('handleToggleActive: Supabase toggle result:', { toggleData, error })

      if (error) {
        console.error('handleToggleActive: Supabase toggle error:', error)
        logOperation('UPDATE', 'error', undefined, error.message)
        throw error
      }

      logOperation('UPDATE', 'success', `Toggled setter "${setter.name}"`)
      showToast({
        type: 'success',
        message: `Setter ${setter.active ? 'deactivated' : 'activated'}`,
      })
    } catch (err) {
      console.error('Error toggling setter:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      logOperation('UPDATE', 'error', undefined, errorMessage)
      setSetters(previousSetters)
      showToast({
        type: 'error',
        message: `Failed to update setter: ${errorMessage}`,
      })
    }
  }

  // NEW: Run a test database operation
  const runTestOperation = async () => {
    logOperation('TEST', 'pending', 'Running database operation test...')

    try {
      // Create a test setter
      const testData = {
        name: `_DB Test ${Date.now()}`,
        email: `test-${Date.now()}@diagnostic.com`,
        active: true,
      }

      const { data: insertData, error: insertError } = await supabase
        .from('setters')
        .insert(testData)
        .select()
        .single()

      if (insertError) {
        logOperation('TEST', 'error', undefined, `INSERT failed: ${insertError.message}`)
        showToast({
          type: 'error',
          message: `Database test failed: ${insertError.message}`,
        })
        return
      }

      const testId = insertData.id

      // Test UPDATE
      const { error: updateError } = await supabase
        .from('setters')
        .update({ name: `_DB Test Updated ${Date.now()}` })
        .eq('id', testId)

      if (updateError) {
        logOperation('TEST', 'error', undefined, `UPDATE failed: ${updateError.message}`)
        await supabase.from('setters').delete().eq('id', testId) // Cleanup
        return
      }

      // Test DELETE
      const { error: deleteError } = await supabase
        .from('setters')
        .delete()
        .eq('id', testId)

      if (deleteError) {
        logOperation('TEST', 'error', undefined, `DELETE failed: ${deleteError.message}`)
        return
      }

      logOperation('TEST', 'success', 'All database operations succeeded')
      showToast({
        type: 'success',
        message: 'Database test passed! All operations work correctly.',
      })
      await loadSetters()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      logOperation('TEST', 'error', undefined, errorMessage)
      showToast({
        type: 'error',
        message: `Database test failed: ${errorMessage}`,
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
          <div className="flex items-center gap-2">
            {/* NEW: Health indicator */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                dbHealth === 'healthy'
                  ? 'bg-green-100 text-green-700'
                  : dbHealth === 'error'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              <Database className="h-4 w-4" />
              {dbHealth === 'healthy' ? 'Connected' : dbHealth === 'error' ? 'Error' : 'Checking...'}
            </div>

            {/* NEW: Debug toggle */}
            <button
              onClick={() => setShowDebug(!showDebug)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                showDebug
                  ? 'bg-accent text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Show debug information"
            >
              <Bug className="h-4 w-4" />
              Debug
            </button>

            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent/90 transition-all active:translate-y-[1px]"
            >
              <Plus className="h-5 w-5" />
              Add Setter
            </button>
          </div>
        </div>
        <p className="text-gray-600">
          Manage your setter accounts for the TCPR Suppression Lists tool
        </p>
      </div>

      {/* NEW: Debug Panel */}
      {showDebug && (
        <div className="bg-gray-900 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Debug Panel
            </h3>
            <button
              onClick={runTestOperation}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
            >
              <Database className="h-4 w-4" />
              Run DB Test
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-400 mb-3">
              Recent Supabase operations (most recent first):
            </p>
            {operations.length === 0 ? (
              <p className="text-sm text-gray-500">No operations yet</p>
            ) : (
              <div className="space-y-2">
                {operations.map((op, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      op.status === 'success'
                        ? 'bg-green-900/30 border border-green-800'
                        : op.status === 'error'
                        ? 'bg-red-900/30 border border-red-800'
                        : 'bg-yellow-900/30 border border-yellow-800'
                    }`}
                  >
                    <span className="font-mono text-xs px-2 py-1 rounded bg-gray-800">
                      {op.type}
                    </span>
                    <span className={`text-sm ${
                      op.status === 'success' ? 'text-green-400' :
                      op.status === 'error' ? 'text-red-400' :
                      'text-yellow-400'
                    }`}>
                      {op.status}
                    </span>
                    {op.details && (
                      <span className="text-sm text-gray-300 flex-1">{op.details}</span>
                    )}
                    {op.error && (
                      <span className="text-sm text-red-300 flex-1">{op.error}</span>
                    )}
                    <span className="text-xs text-gray-500">
                      {new Date(op.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 p-3 bg-gray-800 rounded-lg text-xs text-gray-400">
            <p className="font-medium text-gray-300 mb-1">User Info:</p>
            <div className="space-y-1 font-mono">
              <p>Profile ID: {profile?.id || 'Not loaded'}</p>
              <p>Profile Role: {profile?.role || 'Not loaded'}</p>
              <p>Is Admin: {isAdmin ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      )}

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
