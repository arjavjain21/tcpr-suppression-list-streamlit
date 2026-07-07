/**
 * Confirm Preview
 * Shows a preview of data that will be imported
 */

import { ValidationResult } from '../../lib/types/csv'

export default function ConfirmPreview({
  validationResult,
  onConfirm,
  onBack,
  isProcessing,
}: {
  validationResult: ValidationResult
  onConfirm: () => void
  onBack: () => void
  isProcessing: boolean
}) {
  const validRows = validationResult.rows.filter((row) => row.isValid)
  const displayRows = validRows.slice(0, 50) // Show first 50 rows
  const remainingCount = Math.max(0, validRows.length - 50)

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-white rounded-2xl border border-slate-200/50 p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Confirm Import</h2>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-blue-900 font-medium">
            Ready to import {validationResult.validRows} contacts
          </p>
          <p className="text-blue-700 text-sm mt-1">
            Please review the data below before confirming
          </p>
        </div>

        {/* Import Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-2xl font-bold text-gray-900">
              {validationResult.validRows}
            </div>
            <div className="text-sm text-gray-600 mt-1">Contacts to Import</div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-2xl font-bold text-gray-900">
              {validationResult.warningRows}
            </div>
            <div className="text-sm text-gray-600 mt-1">With Warnings</div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-2xl font-bold text-gray-900">
              {validationResult.invalidRows}
            </div>
            <div className="text-sm text-gray-600 mt-1">Skipped (Errors)</div>
          </div>
        </div>
      </div>

      {/* Preview Table */}
      <div className="bg-white rounded-2xl border border-slate-200/50 overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
        <div className="p-6 border-b border-slate-200">
          <h3 className="font-semibold text-gray-900">Data Preview</h3>
          <p className="text-sm text-gray-600 mt-1">
            Showing first {displayRows.length} rows
            {remainingCount > 0 && ` (+ ${remainingCount} more)`}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Row
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {displayRows.map((row) => (
                <tr key={row.rowNumber} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">{row.rowNumber}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900 font-mono">
                      {row.email_or_domain}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                      {row.entity_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{row.source}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                    {row.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {remainingCount > 0 && (
          <div className="p-4 bg-gray-50 text-center text-sm text-gray-600">
            ... and {remainingCount} more rows
          </div>
        )}
      </div>

      {/* Source Information */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h4 className="font-medium text-gray-900 mb-2">Import Source</h4>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <span className="text-sm text-gray-600">
            These contacts will be tagged with source: <span className="font-mono font-medium">csv_bulk_import</span>
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          disabled={isProcessing}
          className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium transition-colors disabled:opacity-50"
        >
          ← Back to Validation
        </button>

        <button
          onClick={onConfirm}
          disabled={isProcessing}
          className={`
            px-8 py-3 rounded-xl font-medium transition-all active:translate-y-[1px]
            ${
              isProcessing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-accent text-white hover:bg-accent/90'
            }
          `}
        >
          {isProcessing ? 'Processing...' : 'Confirm & Import'}
        </button>
      </div>
    </div>
  )
}
