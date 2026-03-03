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
    if (!url || !key) throw new Error('Missing Supabase environment variables.')
    return createBrowserClient(url, key)
  }, [])

  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const currentUserIdRef = useRef<string | null>(null)

  // ── Auth listener ─────────────────────────────────────────────────
  // Uses onAuthStateChange as single source of truth.
  // INITIAL_SESSION reads from localStorage (instant, never hangs).
  // We NEVER call getUser() on the client (known to hang after inactivity).
  // We NEVER call supabase DB queries inside this callback (can deadlock).
  useEffect(() => {
    let mounted = true

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      if (event === 'INITIAL_SESSION') {
        const currentUser = session?.user ?? null
        currentUserIdRef.current = currentUser?.id ?? null
        setUser(currentUser)
        // If no user, loading done immediately
        // If user exists, loading stays true until profile effect completes
        if (!currentUser) {
          setLoading(false)
        }
        return
      }

      if (event === 'SIGNED_IN') {
        const newUser = session?.user ?? null
        if (newUser && newUser.id !== currentUserIdRef.current) {
          currentUserIdRef.current = newUser.id
          setLoading(true) // Show spinner until profile loads
          setUser(newUser)
        }
        return
      }

      if (event === 'SIGNED_OUT') {
        currentUserIdRef.current = null
        setUser(null)
        setProfile(null)
        return
      }

      // TOKEN_REFRESHED, USER_UPDATED, PASSWORD_RECOVERY, etc:
      // Same user — no state change. This prevents the re-render storms
      // that cause loading loops and cascading data re-fetches.
    })

    // Safety net: if nothing fires within 5s, unblock the UI
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) setLoading(false)
    }, 5000)

    return () => {
      mounted = false
      clearTimeout(safetyTimeout)
      subscription.unsubscribe()
    }
  }, [supabase]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Profile fetch (separate from auth callback to avoid deadlocks) ─
  useEffect(() => {
    if (!user?.id) {
      setProfile(null)
      return
    }

    let mounted = true

    const loadProfile = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        if (mounted) setProfile(data)
      } catch {
        if (mounted) setProfile(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadProfile()

    return () => { mounted = false }
  }, [user?.id, supabase])

  // ── refreshProfile (for use after onboarding, etc.) ───────────────
  const refreshProfile = useCallback(async () => {
    const userId = currentUserIdRef.current
    if (!userId) return
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      setProfile(data)
    } catch {
      // keep existing profile on refresh failure
    }
  }, [supabase])

  const value = useMemo(
    () => ({ user, profile, loading, supabase, refreshProfile }),
    [user, profile, loading, supabase, refreshProfile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
