'use client'

import { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Profile } from '@/types/database'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  supabase: SupabaseClient
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      throw new Error('Missing Supabase environment variables.')
    }
    return createBrowserClient(url, key)
  }, [])

  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const initialized = useRef(false)
  const currentUserIdRef = useRef<string | null>(null)

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      setProfile(data)
    } catch {
      setProfile(null)
    }
  }, [supabase])

  const refreshProfile = useCallback(async () => {
    if (currentUserIdRef.current) {
      await fetchProfile(currentUserIdRef.current)
    }
  }, [fetchProfile])

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        // Use getUser() instead of getSession() to validate with the server
        // and avoid stale/expired session data from localStorage
        const { data: { user: validatedUser }, error } = await supabase.auth.getUser()
        if (!mounted) return

        if (error || !validatedUser) {
          setUser(null)
          setProfile(null)
          currentUserIdRef.current = null
        } else {
          setUser(validatedUser)
          currentUserIdRef.current = validatedUser.id
          await fetchProfile(validatedUser.id)
        }
      } catch {
        if (mounted) {
          setUser(null)
          setProfile(null)
          currentUserIdRef.current = null
        }
      }

      if (mounted) {
        initialized.current = true
        setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      // Skip INITIAL_SESSION since we handle that in init()
      if (event === 'INITIAL_SESSION') return

      const newUser = session?.user ?? null

      // Only update state if user actually changed (prevents re-render loops on token refresh)
      if (event === 'TOKEN_REFRESHED') {
        // Token refreshed but same user - no need to update state
        if (newUser?.id === currentUserIdRef.current) return
      }

      if (event === 'SIGNED_OUT') {
        currentUserIdRef.current = null
        setUser(null)
        setProfile(null)
        return
      }

      // User changed (sign in, or different user)
      if (newUser && newUser.id !== currentUserIdRef.current) {
        currentUserIdRef.current = newUser.id
        setUser(newUser)
        await fetchProfile(newUser.id)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  const value = useMemo(
    () => ({ user, profile, loading, supabase, refreshProfile }),
    [user, profile, loading, supabase, refreshProfile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
