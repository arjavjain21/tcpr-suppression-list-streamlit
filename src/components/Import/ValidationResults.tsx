/**
 * Validation Results
 * Shows validation errors and warnings with detailed breakdown
 */

import { CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { ValidationResult } from '../../lib/types/csv'

export default function ValidationResults({
  validationResult,
  onNext,
  onBack,
}: {
  validationResult: ValidationResult
  onNext: () => void
  onBack: () => void
}) {
  const [showErrors, setShowErrors] = useState(true)
  const [showWarnings, setShowWarnings] = useState(true)

  const hasErrors = validationResult.hasErrors
  const hasWarnings = validationResult.warningRows > 0

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-white rounded-2xl border border-slate-200/50 p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Validation Results</h2>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-gray-900">
              {validationResult.totalRows}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Rows</div>
          </div>

          <div className="bg-green-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-green-600">
              {validationResult.validRows}
            </div>
            <div className="text-sm text-green-700 mt-1">Valid</div>
          </div>

          <div className="bg-red-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-red-600">
              {validationResult.invalidRows}
            </div>
            <div className="text-sm text-red-700 mt-1">Errors</div>
          </div>

          <div className="bg-yellow-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {validationResult.warningRows}
            </div>
            <div className="text-sm text-yellow-700 mt-1">Warnings</div>
          </div>
        </div>

        {/* Overall Status */}
        {!hasErrors ? (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-900">All rows are valid!</p>
              <p className="text-sm text-green-700">
                You can proceed with the import. {hasWarnings && `${validationResult.warningRows} rows have warnings that won't prevent import.`}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-900">Found validation errors</p>
              <p className="text-sm text-red-700">
                {validationResult.invalidRows} rows have errors that must be fixed before importing.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Errors Section */}
      {hasErrors && (
        <div className="bg-white rounded-2xl border border-slate-200/50 p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
          <button
            onClick={() => setShowErrors(!showErrors)}
            className="flex items-center justify-between w-full mb-4"
          >
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Errors ({validationResult.invalidRows})
              </h3>
            </div>
            {showErrors ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {showErrors && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {validationResult.rows
                .filter((row) => !row.isValid)
                .map((row) => (
                  <div
                    key={row.rowNumber}
                    className="bg-red-50 border border-red-200 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                        <span className="text-xs font-semibold text-red-600">
                          {row.rowNumber}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-mono text-sm text-gray-900 mb-1">
                          {row.email_or_domain}
                        </p>
                        <ul className="space-y-1">
                          {row.errors.map((error, idx) => (
                            <li
                              key={idx}
                              className="text-sm text-red-700 flex items-start gap-2"
                            >
                              <span className="text-red-400">•</span>
                              <span>{error}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Warnings Section */}
      {hasWarnings && (
        <div className="bg-white rounded-2xl border border-slate-200/50 p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
          <button
            onClick={() => setShowWarnings(!showWarnings)}
            className="flex items-center justify-between w-full mb-4"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Warnings ({validationResult.warningRows})
              </h3>
            </div>
            {showWarnings ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {showWarnings && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {validationResult.rows
                .filter((row) => row.warnings.length > 0)
                .map((row) => (
                  <div
                    key={row.rowNumber}
                    className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center">
                        <span className="text-xs font-semibold text-yellow-600">
                          {row.rowNumber}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-mono text-sm text-gray-900 mb-1">
                          {row.email_or_domain}
                        </p>
                        <ul className="space-y-1">
                          {row.warnings.map((warning, idx) => (
                            <li
                              key={idx}
                              className="text-sm text-yellow-700 flex items-start gap-2"
                            >
                              <span className="text-yellow-500">•</span>
                              <span>{warning}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium transition-colors"
        >
          ← Back to Upload
        </button>

        <button
          onClick={onNext}
          disabled={hasErrors}
          className={`
            px-8 py-3 rounded-xl font-medium transition-all active:translate-y-[1px]
            ${
              hasErrors
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-accent text-white hover:bg-accent/90'
            }
          `}
        >
          {hasErrors ? 'Fix Errors to Continue' : 'Review & Confirm'}
        </button>
      </div>
    </div>
  )
}
