"use client"

import { useState, useEffect, useRef } from 'react'
import { Headphones, Play, Square } from 'lucide-react'
import { BLOG_COLORS } from '@/lib/blog-colors'

interface TextToSpeechProps {
  text: string
  title?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  cardHovered?: boolean
  onPlayingStateChange?: (isPlaying: boolean, isPaused: boolean) => void
}

const GOLD_COLOR = BLOG_COLORS.GOLD

// Global audio manager to ensure only one audio plays at a time
class AudioManager {
  private static instance: AudioManager
  private currentSynth: SpeechSynthesis | null = null
  private currentComponentId: string | null = null
  private resetCallback: (() => void) | null = null

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager()
    }
    return AudioManager.instance
  }

  stopCurrent(componentId: string) {
    if (this.currentComponentId && this.currentComponentId !== componentId) {
      if (this.currentSynth) {
        // Stop (cancel) the current audio completely
        this.currentSynth.cancel()
        // Reset the previous component's state
        if (this.resetCallback) {
          this.resetCallback()
        }
        // Also clear the current reference
        this.currentSynth = null
        this.currentComponentId = null
        this.resetCallback = null
      }
    }
  }

  setCurrent(synth: SpeechSynthesis, componentId: string, resetCallback: () => void) {
    this.stopCurrent(componentId)
    this.currentSynth = synth
    this.currentComponentId = componentId
    this.resetCallback = resetCallback
  }

  clear() {
    this.currentSynth = null
    this.currentComponentId = null
    this.resetCallback = null
  }

  isCurrent(componentId: string): boolean {
    return this.currentComponentId === componentId
  }
}

const audioManager = AudioManager.getInstance()

export function TextToSpeech({ text, title, size = 'md', className = '', cardHovered = false, onPlayingStateChange }: TextToSpeechProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const sentencesRef = useRef<string[]>([])
  const currentSentenceIndexRef = useRef<number>(0)
  const componentIdRef = useRef<string>(Math.random().toString(36).substring(7))

  // Notify parent component of playing state changes
  useEffect(() => {
    if (onPlayingStateChange) {
      onPlayingStateChange(isPlaying && !isPaused, isPaused)
    }
  }, [isPlaying, isPaused, onPlayingStateChange])

  // Reset function to be called when another component starts playing
  const resetState = () => {
    setIsPlaying(false)
    setIsPaused(false)
    setShowControls(false)
    currentSentenceIndexRef.current = 0
    sentencesRef.current = []
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis
    }

    return () => {
      // Cleanup: stop any ongoing speech when component unmounts
      if (synthRef.current && synthRef.current.speaking) {
        synthRef.current.cancel()
      }
      // Clear audio manager if this component was the current one
      if (audioManager.isCurrent(componentIdRef.current)) {
        audioManager.clear()
      }
    }
  }, [])

  // Split text into sentences and phrases for natural pauses
  const splitIntoSentences = (text: string): string[] => {
    // First, detect markdown headings and add special markers
    // Process text to detect headings (they may have # at start or be separated by spaces)
    // Replace markdown headings (# ## ### etc.) with a special marker
    let processedText = text
      // Match headings that start with # followed by space and text
      .replace(/#{1,6}\s+([^\n#]+)/g, (match, headingText) => {
        return `HEADING_START:${headingText.trim()}:HEADING_END`
      })
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
    
    // Split by sentence endings, but keep the punctuation
    let sentences = processedText
      .split(/(?<=[.!?])\s+(?=[A-Z])/) // Split on sentence boundaries
      .filter(s => s.trim().length > 0)
      .map(s => s.trim())
    
    // Process sentences to handle headings and split long sentences
    const phrases: string[] = []
    sentences.forEach(sentence => {
      // Check if this sentence contains a heading marker
      if (sentence.includes('HEADING_START:') && sentence.includes(':HEADING_END')) {
        // Extract heading text
        const headingMatch = sentence.match(/HEADING_START:(.+?):HEADING_END/)
        if (headingMatch) {
          const headingText = headingMatch[1].trim()
          phrases.push(headingText)
          // Add the rest of the sentence after the heading
          const afterHeading = sentence.replace(/HEADING_START:.+?:HEADING_END\s*/, '').trim()
          if (afterHeading.length > 0) {
            phrases.push(afterHeading)
          }
        }
      } else if (sentence.length > 80 && sentence.includes(',')) {
        // Split long sentences at commas
        const parts = sentence.split(/(?<=,)\s+/)
        phrases.push(...parts)
      } else {
        phrases.push(sentence)
      }
    })
    
    return phrases.length > 0 ? phrases : [text]
  }

  const speakNextSentence = () => {
    if (!synthRef.current) return

    if (currentSentenceIndexRef.current >= sentencesRef.current.length) {
      setIsPlaying(false)
      setIsPaused(false)
      return
    }

    let sentence = sentencesRef.current[currentSentenceIndexRef.current]
    // Remove heading markers from the actual spoken text
    if (sentence.includes('HEADING_START:') && sentence.includes(':HEADING_END')) {
      const headingMatch = sentence.match(/HEADING_START:(.+?):HEADING_END/)
      if (headingMatch) {
        sentence = headingMatch[1].trim()
      }
    }
    const utterance = new SpeechSynthesisUtterance(sentence)
    
    // Configure voice (prefer natural, expressive female voices)
    const voices = synthRef.current.getVoices()
    const femaleVoice = voices.find(voice => 
      voice.name.toLowerCase().includes('samantha') || // macOS - very natural, expressive, warm
      voice.name.toLowerCase().includes('karen') || // macOS - natural, clear, friendly
      voice.name.toLowerCase().includes('susan') || // macOS - natural, professional
      voice.name.toLowerCase().includes('zira') || // Windows - natural, clear
      voice.name.toLowerCase().includes('hazel') || // Windows - natural
      voice.name.toLowerCase().includes('aria') || // Windows - natural, expressive
      (voice.name.toLowerCase().includes('female') && voice.lang.startsWith('en'))
    ) || voices.find(voice => 
      voice.lang.startsWith('en-US') && !voice.name.toLowerCase().includes('male') && 
      !voice.name.toLowerCase().includes('david') && !voice.name.toLowerCase().includes('mark')
    ) || voices.find(voice => voice.lang.startsWith('en'))
    
    if (femaleVoice) {
      utterance.voice = femaleVoice
    }
    
    // More natural speech parameters for human-like quality
    // Slower rate with subtle variation for natural rhythm (0.82-0.90 range)
    const baseRate = 0.86
    const rateVariation = (Math.random() * 0.08) - 0.04 // ±0.04 variation
    utterance.rate = Math.max(0.75, Math.min(0.95, baseRate + rateVariation))
    
    // More expressive pitch variation for natural intonation (1.05-1.25 range)
    const basePitch = 1.18
    const pitchVariation = (Math.random() * 0.20) - 0.10 // ±0.10 variation for expressiveness
    utterance.pitch = Math.max(0.8, Math.min(1.5, basePitch + pitchVariation))
    
    utterance.volume = 1.0
    utterance.lang = 'en-US'

    // Event handlers
    if (currentSentenceIndexRef.current === 0) {
      utterance.onstart = () => {
        setIsPlaying(true)
        setIsPaused(false)
        setShowControls(true)
      }
    }

    utterance.onend = () => {
      currentSentenceIndexRef.current++
      if (currentSentenceIndexRef.current < sentencesRef.current.length) {
        // Check if the current sentence was a heading (marked with HEADING_START/END)
        const isHeading = sentence.includes('HEADING_START:') && sentence.includes(':HEADING_END')
        
        // Natural pause between sentences/phrases with variation
        let basePause = 350
        if (isHeading) {
          // Longer pause after headings (paragraph titles)
          basePause = 800 + Math.random() * 200 // 800-1000ms for headings
        } else if (sentence.endsWith('.')) {
          basePause = 450 + Math.random() * 100 // 450-550ms for periods
        } else if (sentence.endsWith('!') || sentence.endsWith('?')) {
          basePause = 550 + Math.random() * 100 // 550-650ms for exclamations/questions
        } else if (sentence.endsWith(',')) {
          basePause = 200 + Math.random() * 100 // 200-300ms for commas
        } else {
          basePause = 300 + Math.random() * 100 // 300-400ms default
        }
        
        setTimeout(() => {
          if (synthRef.current && !synthRef.current.paused) {
            speakNextSentence()
          }
        }, basePause)
      } else {
        setIsPlaying(false)
        setIsPaused(false)
        audioManager.clear()
      }
    }

    utterance.onerror = () => {
      setIsPlaying(false)
      setIsPaused(false)
    }

    utteranceRef.current = utterance
    synthRef.current.speak(utterance)
  }

  const handlePlay = () => {
    if (!synthRef.current) return

    // Stop any other audio playing on the page (completely stop, not pause)
    // This will also reset the previous component's state via resetCallback
    audioManager.stopCurrent(componentIdRef.current)
    
    // Stop any current speech from this component and reset state
    synthRef.current.cancel()
    resetState()

    // Register this component as the current playing audio with reset callback
    audioManager.setCurrent(synthRef.current, componentIdRef.current, resetState)

    // Split text into sentences for natural pacing
    sentencesRef.current = splitIntoSentences(text)
    currentSentenceIndexRef.current = 0

    speakNextSentence()
  }

  const handlePause = () => {
    if (!synthRef.current) return

    if (synthRef.current.speaking && !synthRef.current.paused) {
      synthRef.current.pause()
      setIsPaused(true)
    } else if (synthRef.current.paused) {
      synthRef.current.resume()
      setIsPaused(false)
      // Resume speaking next sentence if we were between sentences
      if (!synthRef.current.speaking && currentSentenceIndexRef.current < sentencesRef.current.length) {
        speakNextSentence()
      }
    }
  }

  const handleStop = () => {
    if (!synthRef.current) return
    
    synthRef.current.cancel()
    setIsPlaying(false)
    setIsPaused(false)
    setShowControls(false)
    currentSentenceIndexRef.current = 0
    sentencesRef.current = []
    audioManager.clear()
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isPlaying && !isPaused) {
      handlePause()
    } else if (isPaused) {
      handlePause()
    } else {
      handlePlay()
    }
  }

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handlePlay()
  }

  const handleStopClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleStop()
  }

  // Load voices when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // Some browsers need this to load voices
      const loadVoices = () => {
        window.speechSynthesis.getVoices()
      }
      loadVoices()
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices
      }
    }
  }, [])

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  }

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  // Animated waveform component for playing state
  const WaveformIcon = ({ size }: { size: 'sm' | 'md' | 'lg' }) => {
    const barHeight = size === 'sm' ? 'h-3' : size === 'md' ? 'h-4' : 'h-5'
    const barWidth = size === 'sm' ? 'w-0.5' : size === 'md' ? 'w-1' : 'w-1.5'
    // Static gold waveform bars
    const barColor = GOLD_COLOR
    
    return (
      <div className="flex items-center justify-center gap-0.5" style={{ height: iconSizes[size], width: iconSizes[size] }}>
        <div 
          className={`${barWidth} ${barHeight} rounded-full`}
          style={{
            backgroundColor: barColor,
            animation: 'waveform-animation 1s ease-in-out infinite',
            animationDelay: '0s'
          }}
        />
        <div 
          className={`${barWidth} ${barHeight} rounded-full`}
          style={{
            backgroundColor: barColor,
            animation: 'waveform-animation 1s ease-in-out infinite',
            animationDelay: '0.2s'
          }}
        />
        <div 
          className={`${barWidth} ${barHeight} rounded-full`}
          style={{
            backgroundColor: barColor,
            animation: 'waveform-animation 1s ease-in-out infinite',
            animationDelay: '0.4s'
          }}
        />
      </div>
    )
  }

  if (showControls) {
    return (
      <div className={`flex items-center gap-2 ${className}`} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={handleToggle}
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110`}
          style={{
            backgroundColor: '#000000',
            borderColor: GOLD_COLOR,
            borderWidth: '1px',
            borderStyle: 'solid',
            color: GOLD_COLOR
          }}
          aria-label={isPaused ? 'Resume' : 'Pause'}
        >
          {isPaused ? (
            <Play className={iconSizes[size]} fill="currentColor" />
          ) : (
            <WaveformIcon size={size} />
          )}
        </button>
        <button
          onClick={handleStopClick}
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110`}
          style={{
            backgroundColor: '#000000',
            color: GOLD_COLOR,
            borderColor: GOLD_COLOR,
            borderWidth: '1px',
            borderStyle: 'solid'
          }}
          aria-label="Stop"
        >
          <Square className={iconSizes[size]} fill="currentColor" />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handlePlayClick}
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 ${className}`}
      style={{
        backgroundColor: '#000000',
        color: GOLD_COLOR,
        borderColor: GOLD_COLOR,
        borderWidth: '1px',
        borderStyle: 'solid'
      }}
      aria-label="Listen as audio"
      title={title || 'Listen as audio'}
    >
      <Headphones className={iconSizes[size]} />
    </button>
  )
}
