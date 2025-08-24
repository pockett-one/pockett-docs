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
    setTimeout(() => {
      onClose()
      setIsCompleted(false)
    }, 1000)
  }

  const skipTour = () => {
    localStorage.setItem(`tour-${pageName}-completed`, 'true')
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
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
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
            border: '3px solid #3B82F6',
            borderRadius: '8px',
            boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.1)',
            animation: 'pulse 2s infinite'
          }}
        />
      )}

      {/* Completion Overlay */}
      {isCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Tour Complete!
            </h3>
            <p className="text-gray-600">
              You&apos;re all set to explore {pageName}. Enjoy discovering all the features!
            </p>
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

  const startTour = () => setIsTourOpen(true)
  const closeTour = () => setIsTourOpen(false)

  return {
    shouldShowTour,
    isTourOpen,
    startTour,
    closeTour
  }
}
