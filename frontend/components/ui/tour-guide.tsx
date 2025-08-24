"use client"

import { useState, useEffect, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, HelpCircle, CheckCircle } from 'lucide-react'
import { Button } from './button'

export interface TourStep {
  id: string
  title: string
  content: string
  target: string // CSS selector for the element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  action?: 'click' | 'hover' | 'none'
  actionText?: string
}

interface TourGuideProps {
  isOpen: boolean
  onClose: () => void
  steps: TourStep[]
  pageName: string
  onComplete?: () => void
}

export function TourGuide({ isOpen, onClose, steps, pageName, onComplete }: TourGuideProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && steps.length > 0) {
      setCurrentStep(0)
      setIsCompleted(false)
      setHighlightedElement(null)
      highlightElement(steps[0].target)
    }
  }, [isOpen, steps])

  useEffect(() => {
    if (isOpen && steps[currentStep]) {
      highlightElement(steps[currentStep].target)
    }
  }, [currentStep, isOpen, steps])

  const highlightElement = (selector: string) => {
    const element = document.querySelector(selector) as HTMLElement
    if (element) {
      setHighlightedElement(element)
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeTour()
    }
  }

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const completeTour = () => {
    setIsCompleted(true)
    // Save to localStorage that this tour has been completed
    localStorage.setItem(`tour-${pageName}-completed`, 'true')
    onComplete?.()
    // Don't auto-close, let user see completion message
  }

  const skipTour = () => {
    localStorage.setItem(`tour-${pageName}-completed`, 'true')
    setIsCompleted(false)
    setCurrentStep(0)
    setHighlightedElement(null)
    onClose()
  }

  if (!isOpen) return null

  const currentStepData = steps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1

  return (
    <>
      {/* Overlay */}
      <div 
        ref={overlayRef}
        className="fixed inset-0 bg-gray-900 bg-opacity-10 z-50"
        onClick={(e) => e.target === overlayRef.current && skipTour()}
      />

      {/* Tour Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <HelpCircle className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Welcome to {pageName}</h3>
                <p className="text-sm text-gray-500">
                  Step {currentStep + 1} of {steps.length}
                </p>
              </div>
            </div>
            <button
              onClick={skipTour}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              {currentStepData.title}
            </h4>
            <p className="text-gray-600 mb-4">
              {currentStepData.content}
            </p>

            {/* Action Button (if specified) */}
            {currentStepData.action && currentStepData.action !== 'none' && (
              <div className="mb-4">
                <Button
                  onClick={() => {
                    if (highlightedElement) {
                      if (currentStepData.action === 'click') {
                        highlightedElement.click()
                      } else if (currentStepData.action === 'hover') {
                        // Simulate hover effect
                        highlightedElement.style.transform = 'scale(1.05)'
                        setTimeout(() => {
                          highlightedElement.style.transform = ''
                        }, 300)
                      }
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  {currentStepData.actionText || `Try ${currentStepData.action}ing this element`}
                </Button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={previousStep}
              disabled={isFirstStep}
              className={`flex items-center space-x-1 px-3 py-2 text-sm rounded-md transition-colors ${
                isFirstStep
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            <div className="flex space-x-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextStep}
              className="flex items-center space-x-1 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
            >
              <span>{isLastStep ? 'Complete' : 'Next'}</span>
              {!isLastStep && <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Highlighted Element Overlay */}
      {highlightedElement && (
        <div
          className="fixed z-40 pointer-events-none"
          style={{
            top: highlightedElement.offsetTop - 8,
            left: highlightedElement.offsetLeft - 8,
            width: highlightedElement.offsetWidth + 16,
            height: highlightedElement.offsetHeight + 16,
            border: '4px solid #3B82F6',
            borderRadius: '8px',
            boxShadow: '0 0 0 6px rgba(59, 130, 246, 0.3), 0 0 30px rgba(59, 130, 246, 0.4), inset 0 0 20px rgba(59, 130, 246, 0.1)',
            animation: 'pulse 2s infinite',
            backgroundColor: 'rgba(59, 130, 246, 0.1)'
          }}
        />
      )}

      {/* Completion Overlay */}
      {isCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-10">
          <div className="bg-white rounded-lg p-8 text-center shadow-2xl">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Tour Complete!
            </h3>
            <p className="text-gray-600 mb-6">
              You&apos;re all set to explore {pageName}. Enjoy discovering all the features!
            </p>
            <Button
              onClick={() => {
                setIsCompleted(false)
                onClose()
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Got it!
            </Button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </>
  )
}

// Hook to check if tour should be shown
export function useTourGuide(pageName: string) {
  const [shouldShowTour, setShouldShowTour] = useState(false)
  const [isTourOpen, setIsTourOpen] = useState(false)

  useEffect(() => {
    const tourCompleted = localStorage.getItem(`tour-${pageName}-completed`)
    setShouldShowTour(!tourCompleted)
  }, [pageName])

  const startTour = () => {
    // Only start tour if it hasn't been completed
    const tourCompleted = localStorage.getItem(`tour-${pageName}-completed`)
    if (!tourCompleted) {
      setShouldShowTour(true)
      setIsTourOpen(true)
    }
  }
  
  const closeTour = () => {
    setIsTourOpen(false)
    // Don't mark as completed when manually closed
  }

  const resetTour = () => {
    localStorage.removeItem(`tour-${pageName}-completed`)
    setShouldShowTour(true)
    setIsTourOpen(false)
  }

  const forceStartTour = () => {
    // Force start tour even if completed (for manual restart)
    localStorage.removeItem(`tour-${pageName}-completed`)
    setShouldShowTour(true)
    setIsTourOpen(true)
  }

  return {
    shouldShowTour,
    isTourOpen,
    startTour,
    closeTour,
    resetTour,
    forceStartTour
  }
}

// Floating Tour Button Component
export function FloatingTourButton({ 
  pageName, 
  onStartTour, 
  className = "" 
}: { 
  pageName: string
  onStartTour: () => void
  className?: string
}) {
  return (
    <div className={`fixed bottom-6 right-6 z-40 ${className}`}>
      <button
        onClick={onStartTour}
        className="px-4 py-3 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl group cursor-pointer bg-orange-500 hover:bg-orange-600 text-white"
        title={`Take a tour of ${pageName}`}
        aria-label={`Take a tour of ${pageName} page`}
      >
        <div className="flex items-center space-x-2">
          <HelpCircle className="h-5 w-5" />
          <span className="text-sm font-medium whitespace-nowrap select-none">
            Take Tour
          </span>
        </div>
        
        {/* Hover indicator */}
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-orange-400" />
        
        {/* Click feedback */}
        <div className="absolute inset-0 bg-white bg-opacity-20 rounded-lg opacity-0 group-active:opacity-100 transition-opacity duration-150" />
      </button>
    </div>
  )
}
