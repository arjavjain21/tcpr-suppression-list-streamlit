/**
 * Template Section
 * Shows CSV template download instructions and available lead types
 */

import { useEffect, useState } from 'react'
import { Download, FileText, Info } from 'lucide-react'
import { downloadCsvTemplate } from '../../lib/csvParser'
import { getAvailableLeadTypes, getAvailableSetters } from '../../lib/csvValidator'

export default function TemplateSection() {
  const [leadTypes, setLeadTypes] = useState<string[]>([])
  const [setters, setSetters] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [types, setterEmails] = await Promise.all([
          getAvailableLeadTypes(),
          getAvailableSetters(),
        ])
        setLeadTypes(types)
        setSetters(setterEmails)
      } catch (error) {
        console.error('Failed to load reference data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const handleDownloadTemplate = () => {
    downloadCsvTemplate()
  }

  return (
    <div className="space-y-6">
      {/* Instructions Card */}
      <div className="bg-white rounded-2xl border border-slate-200/50 p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Getting Started</h2>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
              <span className="text-accent font-semibold">1</span>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Download the Template</h3>
              <p className="text-gray-600 text-sm mt-1">
                Start with our pre-formatted CSV template that includes all required columns
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
              <span className="text-accent font-semibold">2</span>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Fill in Your Data</h3>
              <p className="text-gray-600 text-sm mt-1">
                Add your contacts, sources, and lead types. See the reference below for valid values.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
              <span className="text-accent font-semibold">3</span>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Upload & Import</h3>
              <p className="text-gray-600 text-sm mt-1">
                Save as CSV and upload to process your contacts
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent/90 transition-all active:translate-y-[1px]"
          >
            <Download className="h-5 w-5" />
            Download CSV Template
          </button>
        </div>
      </div>

      {/* Required Fields */}
      <div className="bg-white rounded-2xl border border-slate-200/50 p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Required Fields</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              email_or_domain <span className="text-red-500">*</span>
            </label>
            <p className="text-gray-600 text-sm">
              Email address (user@example.com) or domain (example.com)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              source <span className="text-red-500">*</span>
            </label>
            <p className="text-gray-600 text-sm">
              Source or campaign name (e.g., "Trade Show 2024")
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              lead_type <span className="text-red-500">*</span>
            </label>
            <p className="text-gray-600 text-sm">
              Must match one of your configured lead types
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              notes <span className="text-gray-400">(optional)</span>
            </label>
            <p className="text-gray-600 text-sm">
              Additional context about this contact
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              setter_email <span className="text-gray-400">(optional)</span>
            </label>
            <p className="text-gray-600 text-sm">
              Email of an existing setter to assign
            </p>
          </div>
        </div>
      </div>

      {/* Reference Data */}
      {!isLoading && (
        <div className="bg-white rounded-2xl border border-slate-200/50 p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Reference Data</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Available Lead Types
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                {leadTypes.length > 0 ? (
                  leadTypes.map((type) => (
                    <div key={type} className="text-sm text-gray-700 font-mono">
                      {type}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">No lead types configured</div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Available Setters
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-1 max-h-48 overflow-y-auto">
                {setters.length > 0 ? (
                  setters.map((setter) => (
                    <div key={setter} className="text-sm text-gray-700 font-mono">
                      {setter}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">No setters configured</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-medium mb-1">File Requirements</p>
          <ul className="space-y-1 text-blue-800">
            <li>• Format: CSV (Comma Separated Values)</li>
            <li>• Max file size: 10MB</li>
            <li>• Encoding: UTF-8</li>
          </ul>
        </div>
      </div>

    </div>
  )
}
