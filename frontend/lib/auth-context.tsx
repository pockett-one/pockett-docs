"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { config } from './config'
import { logger } from './logger'
import { buildUserSettingsPlus } from './actions/user-settings'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithGoogle: (email?: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      
      // Build UserSettingsPlus cache on initial load if user is logged in
      if (session?.user) {
        buildUserSettingsPlus().catch(err => {
          logger.error('Failed to build UserSettingsPlus on initial load', err)
        })
      }
      
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.debug('Auth state change', 'Auth', { event, hasUser: !!session?.user, hasSession: !!session })
        setSession(session)
        setUser(session?.user ?? null)
        
        // Build UserSettingsPlus cache on sign in
        if (event === 'SIGNED_IN' && session?.user) {
          logger.info('User signed in successfully', 'Auth', { email: session?.user?.email })
          
          // Build UserSettingsPlus cache (permissions, settings, preferences)
          buildUserSettingsPlus().catch(err => {
            logger.error('Failed to build UserSettingsPlus on sign in', err)
          })
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async (email?: string) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${config.appUrl}/auth/callback`,
        queryParams: email ? {
          login_hint: email // Pre-fill email if provided
        } : undefined
      }
    })

    if (error) {
      console.error('Error signing in with Google:', error)
      throw error
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Error signing out:', error)
      throw error
    }

    // Note: Redirect is handled by the calling component
  }

  const value = {
    user,
    session,
    loading,
    signInWithGoogle,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
