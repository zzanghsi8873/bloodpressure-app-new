'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import MainLayout from '@/components/layout/main-layout'
import { LogIn, UserPlus, Activity } from 'lucide-react'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(true)
  
  const { signIn, signUp } = useAuth()
  const router = useRouter()

  // Supabase 연결 상태 확인
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    const isConnected = !!(
      supabaseUrl && 
      supabaseKey && 
      supabaseUrl !== 'your-project-url-here' &&
      supabaseKey !== 'your-anon-key-here' &&
      supabaseUrl.includes('supabase.co')
    )
    
    setIsSupabaseConnected(isConnected)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = isLogin 
        ? await signIn(email, password)
        : await signUp(email, password)

      if (error) {
        setError(error.message)
      } else {
        router.push('/')
      }
    } catch (err: any) {
      setError(err.message || '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout title={isLogin ? '로그인' : '회원가입'} showQuickAdd={false}>
      <div className="max-w-md mx-auto space-y-6">
        {/* 페이지 헤더 */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
            {isLogin ? (
              <LogIn className="w-8 h-8 text-white" />
            ) : (
              <UserPlus className="w-8 h-8 text-white" />
            )}
          </div>
          <h1 className="text-display-sm">
            {isLogin ? '로그인' : '회원가입'}
          </h1>
          <p className="text-body-lg text-neutral-400">
            {isLogin 
              ? '혈압 관리 앱에 로그인하세요' 
              : '혈압 관리를 시작해보세요'
            }
          </p>
        </div>

        {/* 로그인/회원가입 폼 */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 이메일 입력 */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-body-lg font-medium">
                이메일
              </label>
              <input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field w-full"
                required
              />
            </div>
            
            {/* 비밀번호 입력 */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-body-lg font-medium">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요 (6자 이상)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field w-full"
                required
                minLength={6}
              />
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg">
                <p className="text-body-sm text-red-400">{error}</p>
              </div>
            )}

            {/* 제출 버튼 */}
            <button
              type="submit"
              className="btn-primary w-full flex items-center justify-center space-x-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>처리 중...</span>
                </>
              ) : (
                <>
                  {isLogin ? (
                    <LogIn className="w-4 h-4" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  <span>{isLogin ? '로그인' : '회원가입'}</span>
                </>
              )}
            </button>
          </form>

          {/* 모드 전환 버튼 */}
          <div className="mt-6 pt-6 border-t border-neutral-700 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-body-md text-primary-400 hover:text-primary-300 transition-colors"
            >
              {isLogin 
                ? '계정이 없으신가요? 회원가입' 
                : '이미 계정이 있으신가요? 로그인'
              }
            </button>
          </div>
        </div>
        
        {/* Supabase 연결 상태 알림 */}
        {!isSupabaseConnected && (
          <div className="card bg-yellow-900/20 border-yellow-700">
            <div className="flex items-start space-x-3">
              <Activity className="w-5 h-5 text-yellow-500 mt-1" />
              <div>
                <h3 className="text-body-lg font-medium text-yellow-400 mb-1">
                  개발 모드
                </h3>
                <p className="text-body-sm text-yellow-300">
                  Supabase가 연결되지 않은 상태입니다. 
                  임의의 이메일로 로그인하면 더미 계정이 생성됩니다.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
} 