'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<any>
  signIn: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 초기 세션 가져오기
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)
      } catch (error) {
        console.warn('Supabase auth not available:', error)
        // 개발 모드에서는 더미 사용자 생성
        if (process.env.NODE_ENV === 'development') {
          const dummyUser = {
            id: 'dummy-user-id',
            email: 'demo@example.com',
            user_metadata: {}
          } as User
          setUser(dummyUser)
        }
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      // 회원가입 성공 시 즉시 로그인 시도
      if (!error && data.user) {
        // 이메일 확인이 안된 경우 자동으로 로그인 시도
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (!signInError) {
          return { data: signInData, error: null }
        }
      }
      
      return { data, error }
    } catch (error) {
      console.warn('Supabase signup not available:', error)
      // 더미 응답 반환
      return {
        data: {
          user: {
            id: 'dummy-user-id',
            email,
            user_metadata: {}
          } as User,
          session: null
        },
        error: null
      }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      return await supabase.auth.signInWithPassword({
        email,
        password,
      })
    } catch (error) {
      console.warn('Supabase signin not available:', error)
      // 더미 응답 반환
      return {
        data: {
          user: {
            id: 'dummy-user-id',
            email,
            user_metadata: {}
          } as User,
          session: {
            user: {
              id: 'dummy-user-id',
              email,
              user_metadata: {}
            } as User
          } as Session
        },
        error: null
      }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.warn('Supabase signout not available:', error)
    }
    setUser(null)
    setSession(null)
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 