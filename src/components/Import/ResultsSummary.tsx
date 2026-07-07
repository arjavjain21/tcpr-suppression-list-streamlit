/**
 * Results Summary
 * Shows the final import results with success/error breakdown
 */

import { CheckCircle2, XCircle, Download, RefreshCw } from 'lucide-react'
import { ImportResult } from '../../lib/types/csv'

export default function ResultsSummary({
  importResult,
  onReset,
}: {
  importResult: ImportResult
  onReset: () => void
}) {
  const successRate =
    importResult.totalRows > 0
      ? Math.round((importResult.successfulImports / importResult.totalRows) * 100)
      : 0

  const durationSeconds = (importResult.duration / 1000).toFixed(1)

  const handleExportErrors = () => {
    if (importResult.errors.length === 0) return

    const errorData = importResult.errors.map((error) => ({
      row: error.rowNumber,
      error: error.error,
    }))

    const csvContent = [
      ['Row Number', 'Error'],
      ...errorData.map((e) => [e.row.toString(), e.error]),
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', 'import_errors.csv')
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      <div className="bg-white rounded-2xl border border-slate-200/50 p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Import Complete!</h2>
            <p className="text-gray-600 mt-1">
              Your contacts have been successfully imported
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-gray-900">
              {importResult.totalRows}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total</div>
          </div>

          <div className="bg-green-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-green-600">
              {importResult.successfulImports}
            </div>
            <div className="text-sm text-green-700 mt-1">Success</div>
          </div>

          <div className="bg-red-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-red-600">
              {importResult.failedImports}
            </div>
            <div className="text-sm text-red-700 mt-1">Failed</div>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">
              {durationSeconds}s
            </div>
            <div className="text-sm text-blue-700 mt-1">Duration</div>
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Success Rate</span>
            <span className="text-sm font-bold text-gray-900">{successRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${successRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Errors Section */}
      {importResult.errors.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/50 p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <XCircle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Import Errors ({importResult.errors.length})
              </h3>
            </div>
            <button
              onClick={handleExportErrors}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export Errors
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {importResult.errors.slice(0, 10).map((error, index) => (
              <div
                key={index}
                className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-xs font-semibold text-red-600">
                    {error.rowNumber}
                  </span>
                </div>
                <p className="text-sm text-red-700">{error.error}</p>
              </div>
            ))}
            {importResult.errors.length > 10 && (
              <div className="text-center text-sm text-gray-600 py-2">
                ... and {importResult.errors.length - 10} more errors
              </div>
            )}
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h4 className="font-medium text-blue-900 mb-3">Next Steps</h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• View your imported contacts in the Records page</li>
          <li>• Check your Dashboard for updated metrics</li>
          {importResult.errors.length > 0 && (
            <li>• Fix the errors above and re-import the failed rows</li>
          )}
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent/90 transition-all active:translate-y-[1px]"
        >
          <RefreshCw className="h-5 w-5" />
          Import More Contacts
        </button>
      </div>
    </div>
  )
}
