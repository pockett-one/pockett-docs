"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { config } from './config'

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
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, 'User:', !!session?.user, 'Session:', !!session)
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Additional debugging for OAuth flow
        if (event === 'SIGNED_IN') {
          console.log('User signed in successfully:', session?.user?.email)

          // Organization creation is now handled by the signup flow at /signup
        }
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
