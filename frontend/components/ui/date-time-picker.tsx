"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Calendar, Clock } from "lucide-react"

interface DateTimePickerProps {
  value?: string
  onChange: (dateTime: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Select date and time",
  className = "",
  disabled = false
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Initialize from value prop
  useEffect(() => {
    if (value) {
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        setSelectedDate(date.toISOString().split('T')[0])
        setSelectedTime(date.toTimeString().slice(0, 5))
      }
    }
  }, [value])

  // Update parent when date or time changes
  useEffect(() => {
    if (selectedDate && selectedTime) {
      const dateTime = new Date(`${selectedDate}T${selectedTime}`)
      onChange(dateTime.toISOString())
    }
  }, [selectedDate, selectedTime, onChange])

  // Set default time if none selected
  useEffect(() => {
    if (selectedDate && !selectedTime) {
      // Set default time to current time + 1 hour
      const now = new Date()
      const defaultTime = new Date(now.getTime() + 60 * 60 * 1000) // +1 hour
      setSelectedTime(defaultTime.toTimeString().slice(0, 5))
    }
  }, [selectedDate, selectedTime])

  const formatDisplayValue = () => {
    if (!selectedDate) return placeholder
    
    const date = new Date(selectedDate)
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
    
    if (selectedTime) {
      const timeDate = new Date(`2000-01-01T${selectedTime}`)
      const timeStr = timeDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
      return `${dateStr} at ${timeStr}`
    }
    
    return `${dateStr} (time not set)`
  }

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      
      const isCurrentMonth = date.getMonth() === month
      const isToday = date.getTime() === today.getTime()
      const isSelected = selectedDate === date.toISOString().split('T')[0]
      const isPast = date < today
      
      days.push({
        date: date.getDate(),
        fullDate: date.toISOString().split('T')[0],
        isCurrentMonth,
        isToday,
        isSelected,
        isPast
      })
    }
    
    return days
  }

  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr)
  }

  const handleTimeChange = (timeStr: string) => {
    setSelectedTime(timeStr)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev)
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1)
      } else {
        newMonth.setMonth(prev.getMonth() + 1)
      }
      return newMonth
    })
  }

  const setToday = () => {
    const today = new Date()
    setSelectedDate(today.toISOString().split('T')[0])
    setSelectedTime(today.toTimeString().slice(0, 5))
  }

  const clearSelection = () => {
    setSelectedDate("")
    setSelectedTime("")
    onChange("")
  }

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full justify-start text-left font-normal"
      >
        <Calendar className="mr-2 h-4 w-4" />
        {formatDisplayValue()}
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 w-80">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Select Date & Time</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          {/* Calendar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-1 hover:bg-gray-100 rounded"
              >
                ‹
              </button>
              <h4 className="text-sm font-medium">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h4>
              <button
                onClick={() => navigateMonth('next')}
                className="p-1 hover:bg-gray-100 rounded"
              >
                ›
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-xs text-gray-500 text-center p-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {generateCalendarDays().map((day, index) => (
                <button
                  key={index}
                  onClick={() => handleDateSelect(day.fullDate)}
                  disabled={day.isPast && !day.isToday}
                  className={`
                    text-xs p-2 rounded transition-colors
                    ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                    ${day.isToday ? 'bg-blue-100 text-blue-600 font-semibold ring-2 ring-blue-200' : ''}
                    ${day.isSelected ? 'bg-blue-600 text-white hover:bg-blue-700 font-semibold' : ''}
                    ${!day.isSelected && !day.isToday ? 'hover:bg-gray-100' : ''}
                    ${day.isPast && !day.isToday ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {day.date}
                </button>
              ))}
            </div>
          </div>

          {/* Time picker */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="inline h-4 w-4 mr-1" />
              Time
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                step="900" // 15-minute intervals
              />
              <div className="flex flex-col space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date()
                    setSelectedTime(now.toTimeString().slice(0, 5))
                  }}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
                >
                  Now
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date()
                    const nextHour = new Date(now.getTime() + 60 * 60 * 1000)
                    setSelectedTime(nextHour.toTimeString().slice(0, 5))
                  }}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
                >
                  +1h
                </button>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {['09:00', '12:00', '15:00', '18:00'].map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => setSelectedTime(time)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    selectedTime === time
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={setToday}
                className="text-xs"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
                className="text-xs"
              >
                Clear
              </Button>
            </div>
            <Button
              size="sm"
              onClick={() => setIsOpen(false)}
              disabled={!selectedDate}
              className="text-xs"
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
