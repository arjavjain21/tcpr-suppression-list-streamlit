/**
 * Import Page
 * Main CSV import page with template download, upload, validation, and preview
 */

import { useState } from 'react'
import TemplateSection from './TemplateSection'
import UploadSection from './UploadSection'
import ValidationResults from './ValidationResults'
import ConfirmPreview from './ConfirmPreview'
import ProgressTracker from './ProgressTracker'
import ResultsSummary from './ResultsSummary'
import { parseCsvFile, validateCsvFile } from '../../lib/csvParser'
import { validateCsvRows } from '../../lib/csvValidator'
import { importRows, canImport } from '../../lib/importService'
import { CsvRow, ValidationResult, ImportResult } from '../../lib/types/csv'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'

type ImportStep = 'upload' | 'validation' | 'preview' | 'importing' | 'complete'

export default function Import() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload')
  const [csvData, setCsvData] = useState<CsvRow[]>([])
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileSelect = async (file: File) => {
    try {
      // Validate file
      const fileValidation = validateCsvFile(file)
      if (!fileValidation.isValid) {
        showToast({
          type: 'error',
          message: fileValidation.error || 'Invalid file',
        })
        return
      }

      setIsProcessing(true)

      // Parse CSV
      const parseResult = await parseCsvFile(file)

      if (parseResult.data.length === 0) {
        showToast({
          type: 'error',
          message: 'CSV file is empty or has no valid rows',
        })
        setIsProcessing(false)
        return
      }

      setCsvData(parseResult.data)

      // Validate rows
      const validation = await validateCsvRows(parseResult.data)
      setValidationResult(validation)

      setCurrentStep('validation')
      setIsProcessing(false)

      if (validation.hasErrors) {
        showToast({
          type: 'warning',
          message: `Found ${validation.invalidRows} rows with errors. Please review before continuing.`,
        })
      } else {
        showToast({
          type: 'success',
          message: `Successfully parsed ${validation.totalRows} rows`,
        })
      }
    } catch (error) {
      setIsProcessing(false)
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to parse CSV file',
      })
    }
  }

  const handleConfirmImport = async () => {
    if (!user || !validationResult) return

    // Check import quota
    const quotaCheck = await canImport(user.id)
    if (!quotaCheck.canImport) {
      showToast({
        type: 'error',
        message: quotaCheck.reason || 'Cannot import at this time',
      })
      return
    }

    setCurrentStep('importing')
    setIsProcessing(true)

    try {
      const result = await importRows(
        validationResult.rows,
        'csv_bulk_import',
        user.id,
        {
          batchSize: 100,
          continueOnError: true,
          dryRun: false,
        }
      )

      setImportResult(result)
      setCurrentStep('complete')
      setIsProcessing(false)

      if (result.failedImports > 0) {
        showToast({
          type: 'warning',
          message: `Imported ${result.successfulImports} rows with ${result.failedImports} errors`,
        })
      } else {
        showToast({
          type: 'success',
          message: `Successfully imported ${result.successfulImports} rows`,
        })
      }
    } catch (error) {
      setIsProcessing(false)
      setCurrentStep('preview')
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Import failed',
      })
    }
  }

  const handleReset = () => {
    setCurrentStep('upload')
    setCsvData([])
    setValidationResult(null)
    setImportResult(null)
  }

  const handleBackToValidation = () => {
    setCurrentStep('validation')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
          CSV Import
        </h1>
        <p className="mt-2 text-gray-600">
          Import contacts in bulk using our CSV template
        </p>
      </div>

      {/* Step Indicator */}
      <ProgressTracker currentStep={currentStep} />

      {/* Step Content */}
      <div className="mb-6">
        <TemplateSection />
      </div>

      {currentStep === 'upload' && (
        <UploadSection onFileSelect={handleFileSelect} isProcessing={isProcessing} />
      )}

      {currentStep === 'validation' && validationResult && (
        <ValidationResults
          validationResult={validationResult}
          onNext={() => setCurrentStep('preview')}
          onBack={() => setCurrentStep('upload')}
        />
      )}

      {currentStep === 'preview' && validationResult && (
        <ConfirmPreview
          validationResult={validationResult}
          onConfirm={handleConfirmImport}
          onBack={handleBackToValidation}
          isProcessing={isProcessing}
        />
      )}

      {currentStep === 'importing' && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent" />
          <p className="mt-4 text-gray-600">Importing contacts...</p>
        </div>
      )}

      {currentStep === 'complete' && importResult && (
        <ResultsSummary
          importResult={importResult}
          onReset={handleReset}
        />
      )}
    </div>
  )
}
