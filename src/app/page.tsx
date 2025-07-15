'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import MainLayout from '@/components/layout/main-layout'
import { bpAPI, getBPStatus } from '@/lib/supabase'
import { Activity, Heart, Weight, Calendar } from 'lucide-react'

interface DashboardStats {
  count: number
  average: { systolic: number; diastolic: number; pulse: number }
  latest: any
  trend: any[]
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [tips, setTips] = useState<any[]>([])
  
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  // 인증 상태 확인
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
      return
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      
      // 통계 데이터 로드
      const statsData = await bpAPI.getStats(user.id, 30)
      setStats(statsData)
      
      // 건강 팁 로드
      const { data: tipsData } = await bpAPI.getTips(undefined, 3)
      setTips(tipsData || [])
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 인증 로딩 중
  if (authLoading) {
    return (
      <MainLayout title="혈압 기록">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <Activity className="w-12 h-12 text-primary-500 mx-auto mb-4 animate-pulse" />
            <p className="text-neutral-400">인증 확인 중...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  // 로그인되지 않은 상태
  if (!user) {
    return null // 리다이렉트 중
  }

  // 데이터 로딩 중
  if (loading) {
    return (
      <MainLayout title="혈압 기록">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <Activity className="w-12 h-12 text-primary-500 mx-auto mb-4 animate-pulse" />
            <p className="text-neutral-400">데이터를 불러오는 중...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  const bpStatus = stats?.latest 
    ? getBPStatus(stats.latest.systolic, stats.latest.diastolic)
    : null

  return (
    <MainLayout title="혈압 기록">
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div className="text-center space-y-2">
          <h1 className="text-display-sm">안녕하세요! 👋</h1>
          <p className="text-body-lg text-neutral-400">
            오늘의 혈압을 기록하고 건강을 관리하세요
          </p>
        </div>

        {/* 오늘의 요약 카드 */}
        {stats?.latest && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-heading-md">최근 기록</h2>
              <span className="text-body-sm text-neutral-400">
                {new Date(stats.latest.measured_at).toLocaleDateString('ko-KR')}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="bp-reading">{stats.latest.systolic}</div>
                  <div className="bp-label">수축기</div>
                </div>
                <div className="text-neutral-600">/</div>
                <div className="text-center">
                  <div className="bp-reading">{stats.latest.diastolic}</div>
                  <div className="bp-label">이완기</div>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`text-heading-sm font-bold ${bpStatus?.color}`}>
                  {bpStatus?.label}
                </div>
                <div className="text-body-sm text-neutral-400">
                  맥박: {stats.latest.pulse} bpm
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 통계 카드들 */}
        <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-4">
          {/* 평균 혈압 */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-3">
              <Heart className="w-6 h-6 text-primary-500" />
              <h3 className="text-heading-sm">30일 평균</h3>
            </div>
            {stats?.average ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-body-md text-neutral-400">수축기</span>
                  <span className="text-heading-sm">{stats.average.systolic}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-body-md text-neutral-400">이완기</span>
                  <span className="text-heading-sm">{stats.average.diastolic}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-body-md text-neutral-400">맥박</span>
                  <span className="text-heading-sm">{stats.average.pulse}</span>
                </div>
              </div>
            ) : (
              <p className="text-neutral-500 text-center py-4">데이터 없음</p>
            )}
          </div>

          {/* 기록 횟수 */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-3">
              <Calendar className="w-6 h-6 text-primary-500" />
              <h3 className="text-heading-sm">이번 달 기록</h3>
            </div>
            <div className="text-center py-2">
              <div className="text-display-md text-primary-500 font-bold">
                {stats?.count || 0}
              </div>
              <div className="text-body-sm text-neutral-400">회</div>
            </div>
          </div>

          {/* 체중 (최근 기록 있는 경우) */}
          {stats?.latest?.weight && (
            <div className="card">
              <div className="flex items-center space-x-3 mb-3">
                <Weight className="w-6 h-6 text-primary-500" />
                <h3 className="text-heading-sm">최근 체중</h3>
              </div>
              <div className="text-center py-2">
                <div className="text-display-md text-primary-500 font-bold">
                  {stats.latest.weight}
                </div>
                <div className="text-body-sm text-neutral-400">kg</div>
              </div>
            </div>
          )}
        </div>

        {/* 건강 팁 */}
        {tips.length > 0 && (
          <div className="card">
            <h3 className="text-heading-md mb-4">💡 건강 팁</h3>
            <div className="space-y-3">
              {tips.map((tip) => (
                <div key={tip.id} className="p-3 bg-neutral-800 rounded-lg">
                  <h4 className="text-body-lg font-semibold mb-1">{tip.title}</h4>
                  <p className="text-body-md text-neutral-400">{tip.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 첫 기록 안내 (데이터가 없는 경우) */}
        {!stats?.count && (
          <div className="card text-center py-8">
            <Activity className="w-16 h-16 text-primary-500 mx-auto mb-4" />
            <h3 className="text-heading-md mb-2">첫 혈압 기록을 시작해보세요!</h3>
            <p className="text-body-md text-neutral-400 mb-6">
              혈압을 꾸준히 기록하여 건강을 체계적으로 관리하세요
            </p>
            <button 
              onClick={() => window.location.href = '/add'}
              className="btn-primary"
            >
              지금 기록하기
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
