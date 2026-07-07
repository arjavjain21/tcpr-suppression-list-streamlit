/**
 * Upload Section
 * Drag-and-drop file upload area
 */

import { useCallback, useState } from 'react'
import { Upload, FileUp, AlertCircle } from 'lucide-react'

export default function UploadSection({
  onFileSelect,
  isProcessing,
}: {
  onFileSelect: (file: File) => void
  isProcessing: boolean
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true)
    } else if (e.type === 'dragleave') {
      setIsDragging(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        handleFile(files[0])
      }
    },
    []
  )

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFile = (file: File) => {
    setError(null)

    // Validate file type
    const validTypes = ['text/csv', 'application/vnd.ms-excel']
    const fileExtension = file.name.toLowerCase().split('.').pop()

    if (!validTypes.includes(file.type) && fileExtension !== 'csv') {
      setError('Please upload a CSV file')
      return
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setError('File size exceeds 10MB limit')
      return
    }

    onFileSelect(file)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/50 p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Upload Your CSV</h2>

        {/* Upload Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-xl p-12
            transition-all duration-200
            ${
              isDragging
                ? 'border-accent bg-accent/5'
                : 'border-slate-300 hover:border-accent/50'
            }
            ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <input
            type="file"
            accept=".csv,text/csv,application/vnd.ms-excel"
            onChange={handleFileInput}
            disabled={isProcessing}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />

          <div className="flex flex-col items-center text-center">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
                isDragging ? 'bg-accent text-white' : 'bg-gray-100 text-gray-400'
              }`}
            >
              {isDragging ? (
                <FileUp className="h-8 w-8" />
              ) : (
                <Upload className="h-8 w-8" />
              )}
            </div>

            <h3
              className={`text-lg font-medium mb-2 ${
                isDragging ? 'text-accent' : 'text-gray-900'
              }`}
            >
              {isDragging ? 'Drop your CSV here' : 'Drag & drop your CSV file'}
            </h3>

            <p className="text-gray-600 text-sm mb-4">
              or click to browse your files
            </p>

            <p className="text-gray-400 text-xs">Maximum file size: 10MB</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="bg-white rounded-2xl border border-slate-200/50 p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
            <p className="text-gray-600">Processing your CSV file...</p>
          </div>
        </div>
      )}
    </div>
  )
}
