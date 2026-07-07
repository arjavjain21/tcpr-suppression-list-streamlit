/**
 * Progress Tracker
 * Shows the current step in the import process
 */

import { Circle, CheckCircle2, Upload, CheckCheck, Database, Sparkles } from 'lucide-react'

const STEPS = [
  { id: 'upload', label: 'Upload', icon: Upload },
  { id: 'validation', label: 'Validate', icon: CheckCheck },
  { id: 'preview', label: 'Preview', icon: CheckCircle2 },
  { id: 'importing', label: 'Import', icon: Database },
  { id: 'complete', label: 'Complete', icon: Sparkles },
] as const

export default function ProgressTracker({ currentStep }: { currentStep: string }) {
  const getCurrentIndex = () => {
    return STEPS.findIndex((step) => step.id === currentStep)
  }

  const currentIndex = getCurrentIndex()

  const getStepStatus = (index: number) => {
    if (index < currentIndex) return 'completed'
    if (index === currentIndex) return 'current'
    return 'pending'
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/50 p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const status = getStepStatus(index)
          const Icon = step.icon
          const isLast = index === STEPS.length - 1

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center
                    transition-all duration-300
                    ${
                      status === 'completed'
                        ? 'bg-green-100 text-green-600'
                        : status === 'current'
                        ? 'bg-accent text-white scale-110'
                        : 'bg-gray-100 text-gray-400'
                    }
                  `}
                >
                  {status === 'completed' ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <Icon className="h-6 w-6" />
                  )}
                </div>
                <div
                  className={`
                    mt-2 text-xs font-medium text-center transition-colors
                    ${
                      status === 'completed'
                        ? 'text-green-600'
                        : status === 'current'
                        ? 'text-accent font-semibold'
                        : 'text-gray-400'
                    }
                  `}
                >
                  {step.label}
                </div>
              </div>

              {/* Connector */}
              {!isLast && (
                <div
                  className={`
                    flex-1 h-0.5 mx-2 transition-colors duration-300
                    ${
                      status === 'completed'
                        ? 'bg-green-400'
                        : 'bg-gray-200'
                    }
                  `}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
