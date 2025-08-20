"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { X, ChevronLeft, ChevronRight, Play, HelpCircle } from "lucide-react"

interface TourStep {
  id: string
  title: string
  content: string
  target: string // CSS selector for the target element
  position?: 'top' | 'bottom' | 'left' | 'right'
  showNext?: boolean
  showPrev?: boolean
  showSkip?: boolean
}

interface GuidedTourProps {
  steps: TourStep[]
  tourKey: string // Unique key for this tour (for localStorage tracking)
  autoStart?: boolean
  showStartButton?: boolean
}

export function GuidedTour({ 
  steps, 
  tourKey, 
  autoStart = false, 
  showStartButton = true 
}: GuidedTourProps) {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [targetElement, setTargetElement] = useState<Element | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check if user has completed this tour
    const completed = localStorage.getItem(`tour_completed_${tourKey}`)
    if (!completed && autoStart) {
      // Add a delay to ensure DOM is ready
      setTimeout(() => {
        setIsActive(true)
      }, 1000)
    }
  }, [tourKey, autoStart])

  useEffect(() => {
    if (isActive && steps[currentStep]) {
      const step = steps[currentStep]
      const element = document.querySelector(step.target)
      setTargetElement(element)
      
      if (element) {
        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        
        // Calculate tooltip position
        const rect = element.getBoundingClientRect()
        const tooltipRect = tooltipRef.current?.getBoundingClientRect()
        const tooltipWidth = tooltipRect?.width || 320
        const tooltipHeight = tooltipRect?.height || 200
        
        let top = rect.top + window.scrollY
        let left = rect.left + window.scrollX
        
        // Adjust position based on preferred position
        switch (step.position || 'bottom') {
          case 'top':
            top = rect.top + window.scrollY - tooltipHeight - 12
            left = rect.left + window.scrollX + (rect.width / 2) - (tooltipWidth / 2)
            break
          case 'bottom':
            top = rect.bottom + window.scrollY + 12
            left = rect.left + window.scrollX + (rect.width / 2) - (tooltipWidth / 2)
            break
          case 'left':
            top = rect.top + window.scrollY + (rect.height / 2) - (tooltipHeight / 2)
            left = rect.left + window.scrollX - tooltipWidth - 12
            break
          case 'right':
            top = rect.top + window.scrollY + (rect.height / 2) - (tooltipHeight / 2)
            left = rect.right + window.scrollX + 12
            break
        }
        
        // Ensure tooltip stays within viewport
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        
        if (left < 10) left = 10
        if (left + tooltipWidth > viewportWidth - 10) left = viewportWidth - tooltipWidth - 10
        if (top < 10) top = 10
        if (top + tooltipHeight > viewportHeight - 10) top = viewportHeight - tooltipHeight - 10
        
        setTooltipPosition({ top, left })
        
        // Highlight the target element
        element.classList.add('tour-highlight')
      }
    }
    
    // Cleanup previous highlight
    return () => {
      if (targetElement) {
        targetElement.classList.remove('tour-highlight')
      }
    }
  }, [isActive, currentStep, steps, targetElement])

  const startTour = () => {
    setCurrentStep(0)
    setIsActive(true)
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      endTour()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const skipTour = () => {
    endTour()
  }

  const endTour = () => {
    if (targetElement) {
      targetElement.classList.remove('tour-highlight')
    }
    setIsActive(false)
    setCurrentStep(0)
    localStorage.setItem(`tour_completed_${tourKey}`, 'true')
  }

  const resetTour = () => {
    localStorage.removeItem(`tour_completed_${tourKey}`)
    startTour()
  }

  if (!isActive && showStartButton) {
    return (
      <Button
        onClick={startTour}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 bg-white shadow-lg border-blue-300 text-blue-700 hover:bg-blue-50"
      >
        <HelpCircle className="h-4 w-4 mr-2" />
        Start Tour
      </Button>
    )
  }

  if (!isActive || !steps[currentStep]) return null

  const step = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 pointer-events-none" />
      
      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-200 max-w-sm"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
        }}
      >
        {/* Progress bar */}
        <div className="w-full bg-gray-200 h-1 rounded-t-lg">
          <div 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-1 rounded-t-lg transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{currentStep + 1}</span>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">{step.title}</h3>
            </div>
            <button
              onClick={endTour}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            {step.content}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {step.showPrev !== false && currentStep > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevStep}
                  className="text-xs"
                >
                  <ChevronLeft className="h-3 w-3 mr-1" />
                  Back
                </Button>
              )}
              
              {step.showSkip !== false && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipTour}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Skip Tour
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                {currentStep + 1} of {steps.length}
              </span>
              {step.showNext !== false && (
                <Button
                  size="sm"
                  onClick={nextStep}
                  className="text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                  {currentStep < steps.length - 1 && <ChevronRight className="h-3 w-3 ml-1" />}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CSS for highlighting */}
      <style jsx global>{`
        .tour-highlight {
          position: relative;
          z-index: 45;
          border-radius: 8px;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 8px rgba(59, 130, 246, 0.2) !important;
          background-color: rgba(59, 130, 246, 0.05) !important;
          transition: all 0.3s ease !important;
        }
      `}</style>
    </>
  )
}