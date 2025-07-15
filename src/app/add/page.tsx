'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import MainLayout from '@/components/layout/main-layout'
import { bpAPI } from '@/lib/supabase'
import { ArrowLeft, Save, Activity } from 'lucide-react'
import Link from 'next/link'

interface FormData {
  systolic: string
  diastolic: string
  pulse: string
  weight: string
  recordedAt: string
}

export default function AddReading() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [formData, setFormData] = useState<FormData>({
    systolic: '',
    diastolic: '',
    pulse: '',
    weight: '',
    recordedAt: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:MM 형식
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<FormData>>({})

  // 인증 상태 확인
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
      return
    }
  }, [user, authLoading, router])

  // 로그인되지 않은 상태
  if (authLoading) {
    return (
      <MainLayout title="혈압 기록" showQuickAdd={false}>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <Activity className="w-12 h-12 text-primary-500 mx-auto mb-4 animate-pulse" />
            <p className="text-neutral-400">인증 확인 중...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!user) {
    return null // 리다이렉트 중
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // 에러 클리어
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {}

    // 필수 필드 검증
    if (!formData.systolic) {
      newErrors.systolic = '수축기 혈압을 입력하세요'
    } else if (parseInt(formData.systolic) < 60 || parseInt(formData.systolic) > 250) {
      newErrors.systolic = '수축기 혈압은 60~250 사이여야 합니다'
    }

    if (!formData.diastolic) {
      newErrors.diastolic = '이완기 혈압을 입력하세요'
    } else if (parseInt(formData.diastolic) < 40 || parseInt(formData.diastolic) > 150) {
      newErrors.diastolic = '이완기 혈압은 40~150 사이여야 합니다'
    }

    if (!formData.pulse) {
      newErrors.pulse = '맥박을 입력하세요'
    } else if (parseInt(formData.pulse) < 30 || parseInt(formData.pulse) > 200) {
      newErrors.pulse = '맥박은 30~200 사이여야 합니다'
    }

    // 혈압 논리 검증
    if (formData.systolic && formData.diastolic) {
      const systolic = parseInt(formData.systolic)
      const diastolic = parseInt(formData.diastolic)
      
      if (systolic <= diastolic) {
        newErrors.systolic = '수축기 혈압이 이완기 혈압보다 높아야 합니다'
      }
    }

    // 체중 검증 (선택사항)
    if (formData.weight && (parseFloat(formData.weight) < 20 || parseFloat(formData.weight) > 200)) {
      newErrors.weight = '체중은 20~200kg 사이여야 합니다'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    
    try {
      const reading = {
        user_id: user.id,
        systolic: parseInt(formData.systolic),
        diastolic: parseInt(formData.diastolic),
        pulse: parseInt(formData.pulse),
        weight: formData.weight ? parseFloat(formData.weight) : null,
        measured_at: new Date(formData.recordedAt).toISOString(),
      }

      await bpAPI.addReading(reading)
      
      // 성공 시 대시보드로 이동
      router.push('/')
    } catch (error) {
      console.error('혈압 기록 저장 실패:', error)
      // 에러 처리 (토스트 메시지 등)
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout title="혈압 기록" showQuickAdd={false}>
      <div className="max-w-lg mx-auto">
        {/* 헤더 */}
        <div className="flex items-center space-x-4 mb-6">
          <Link href="/" className="btn-ghost p-2">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-heading-lg">혈압 기록</h1>
            <p className="text-body-md text-neutral-400">
              오늘의 혈압을 정확히 기록해보세요
            </p>
          </div>
        </div>

        {/* 입력 폼 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 측정 시간 */}
          <div className="card">
            <label className="block text-body-lg font-medium mb-2">
              측정 시간
            </label>
            <input
              type="datetime-local"
              value={formData.recordedAt}
              onChange={(e) => handleInputChange('recordedAt', e.target.value)}
              className="input-field w-full"
              required
            />
          </div>

          {/* 혈압 입력 */}
          <div className="card">
            <h3 className="text-heading-sm mb-4 flex items-center space-x-2">
              <Activity className="w-5 h-5 text-primary-500" />
              <span>혈압 수치</span>
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              {/* 수축기 */}
              <div>
                <label className="block text-body-sm font-medium mb-2">
                  수축기 (mmHg)
                </label>
                <input
                  type="number"
                  placeholder="120"
                  value={formData.systolic}
                  onChange={(e) => handleInputChange('systolic', e.target.value)}
                  className={`input-field w-full ${errors.systolic ? 'border-bp-high' : ''}`}
                  min="60"
                  max="250"
                  required
                />
                {errors.systolic && (
                  <p className="text-bp-high text-body-sm mt-1">{errors.systolic}</p>
                )}
              </div>

              {/* 이완기 */}
              <div>
                <label className="block text-body-sm font-medium mb-2">
                  이완기 (mmHg)
                </label>
                <input
                  type="number"
                  placeholder="80"
                  value={formData.diastolic}
                  onChange={(e) => handleInputChange('diastolic', e.target.value)}
                  className={`input-field w-full ${errors.diastolic ? 'border-bp-high' : ''}`}
                  min="40"
                  max="150"
                  required
                />
                {errors.diastolic && (
                  <p className="text-bp-high text-body-sm mt-1">{errors.diastolic}</p>
                )}
              </div>
            </div>
          </div>

          {/* 맥박 입력 */}
          <div className="card">
            <label className="block text-body-lg font-medium mb-2">
              맥박 (bpm)
            </label>
            <input
              type="number"
              placeholder="72"
              value={formData.pulse}
              onChange={(e) => handleInputChange('pulse', e.target.value)}
              className={`input-field w-full ${errors.pulse ? 'border-bp-high' : ''}`}
              min="30"
              max="200"
              required
            />
            {errors.pulse && (
              <p className="text-bp-high text-body-sm mt-1">{errors.pulse}</p>
            )}
          </div>

          {/* 체중 입력 (선택사항) */}
          <div className="card">
            <label className="block text-body-lg font-medium mb-2">
              체중 (kg) <span className="text-neutral-500 text-body-sm">- 선택사항</span>
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="70.5"
              value={formData.weight}
              onChange={(e) => handleInputChange('weight', e.target.value)}
              className={`input-field w-full ${errors.weight ? 'border-bp-high' : ''}`}
              min="20"
              max="200"
            />
            {errors.weight && (
              <p className="text-bp-high text-body-sm mt-1">{errors.weight}</p>
            )}
          </div>

          {/* 제출 버튼 */}
          <div className="flex space-x-3">
            <Link href="/" className="btn-secondary flex-1 text-center">
              취소
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-neutral-900 border-t-transparent"></div>
                  <span>저장 중...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>저장</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* 도움말 */}
        <div className="mt-6 p-4 bg-neutral-800 rounded-lg">
          <h4 className="text-body-lg font-semibold mb-2">💡 정확한 측정을 위한 팁</h4>
          <ul className="text-body-sm text-neutral-400 space-y-1">
            <li>• 측정 전 5분간 안정을 취하세요</li>
            <li>• 같은 팔, 같은 시간대에 측정하세요</li>
            <li>• 카페인, 흡연 후 30분은 피하세요</li>
            <li>• 편안한 자세로 측정하세요</li>
          </ul>
        </div>
      </div>
    </MainLayout>
  )
} 