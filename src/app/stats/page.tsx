'use client'

import { useEffect, useState } from 'react'
import MainLayout from '@/components/layout/main-layout'
import { bpAPI, getBPStatus } from '@/lib/supabase'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { TrendingUp, Calendar, Heart, Activity } from 'lucide-react'

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

// 임시 사용자 ID
const TEMP_USER_ID = '123e4567-e89b-12d3-a456-426614174000'

interface StatsData {
  count: number
  average: { systolic: number; diastolic: number; pulse: number }
  latest: any
  trend: any[]
}

const periodOptions = [
  { value: 7, label: '7일' },
  { value: 30, label: '30일' },
  { value: 90, label: '90일' },
  { value: 365, label: '1년' },
]

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState(30)
  const [chartData, setChartData] = useState<any>(null)

  useEffect(() => {
    loadStatsData()
  }, [selectedPeriod])

  const loadStatsData = async () => {
    try {
      setLoading(true)
      
      const statsData = await bpAPI.getStats(TEMP_USER_ID, selectedPeriod)
      setStats(statsData)
      
      // 차트 데이터 준비
      if (statsData.trend && statsData.trend.length > 0) {
        const labels = statsData.trend.map(reading => 
          new Date(reading.measured_at).toLocaleDateString('ko-KR', { 
            month: 'short', 
            day: 'numeric' 
          })
        )
        
        const chartConfig = {
          labels,
          datasets: [
            {
              label: '수축기',
              data: statsData.trend.map(reading => reading.systolic),
              borderColor: '#FF5400',
              backgroundColor: '#FF5400CC',
              borderWidth: 3,
              pointRadius: 4,
              pointHoverRadius: 6,
              tension: 0.3,
            },
            {
              label: '이완기',
              data: statsData.trend.map(reading => reading.diastolic),
              borderColor: '#22C55E',
              backgroundColor: '#22C55ECC',
              borderWidth: 3,
              pointRadius: 4,
              pointHoverRadius: 6,
              tension: 0.3,
            },
          ],
        }
        
        setChartData(chartConfig)
      }
    } catch (error) {
      console.error('통계 데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#FFFFFF',
          font: {
            size: 14,
          },
        },
      },
      title: {
        display: true,
        text: `최근 ${selectedPeriod}일 혈압 추이`,
        color: '#FFFFFF',
        font: {
          size: 16,
        },
      },
      tooltip: {
        backgroundColor: '#1A1A1A',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        borderColor: '#333333',
        borderWidth: 1,
        callbacks: {
          afterBody: (context: any) => {
            const dataIndex = context[0].dataIndex
            const reading = stats?.trend[dataIndex]
            if (reading) {
              const status = getBPStatus(reading.systolic, reading.diastolic)
              return [`맥박: ${reading.pulse} bpm`, `상태: ${status.label}`]
            }
            return []
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#B3B3B3',
        },
        grid: {
          color: '#333333',
        },
      },
      y: {
        ticks: {
          color: '#B3B3B3',
        },
        grid: {
          color: '#333333',
        },
        min: 40,
        max: 200,
      },
    },
  }

  if (loading) {
    return (
      <MainLayout title="통계">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 text-primary-500 mx-auto mb-4 animate-pulse" />
            <p className="text-neutral-400">통계를 분석하는 중...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="통계">
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-6 h-6 text-primary-500" />
            <h1 className="text-heading-lg">혈압 통계</h1>
          </div>

          {/* 기간 선택 */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(Number(e.target.value))}
            className="input-field"
          >
            {periodOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {stats?.count === 0 ? (
          /* 데이터 없음 */
          <div className="card text-center py-16">
            <TrendingUp className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-heading-md mb-2">통계 데이터가 없습니다</h3>
            <p className="text-body-md text-neutral-400 mb-6">
              혈압을 기록하면 여기에 통계가 표시됩니다
            </p>
            <button 
              onClick={() => window.location.href = '/add'}
              className="btn-primary"
            >
              첫 기록 시작하기
            </button>
          </div>
        ) : (
          <>
            {/* 요약 카드들 */}
            <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-4 gap-4">
              {/* 총 기록 수 */}
              <div className="card">
                <div className="flex items-center space-x-3 mb-3">
                  <Calendar className="w-6 h-6 text-primary-500" />
                  <h3 className="text-heading-sm">총 기록</h3>
                </div>
                <div className="text-center py-2">
                  <div className="text-display-md text-primary-500 font-bold">
                    {stats?.count}
                  </div>
                  <div className="text-body-sm text-neutral-400">회</div>
                </div>
              </div>

              {/* 평균 수축기 */}
              <div className="card">
                <div className="flex items-center space-x-3 mb-3">
                  <Heart className="w-6 h-6 text-primary-500" />
                  <h3 className="text-heading-sm">평균 수축기</h3>
                </div>
                <div className="text-center py-2">
                  <div className="text-display-md text-primary-500 font-bold">
                    {stats?.average.systolic}
                  </div>
                  <div className="text-body-sm text-neutral-400">mmHg</div>
                </div>
              </div>

              {/* 평균 이완기 */}
              <div className="card">
                <div className="flex items-center space-x-3 mb-3">
                  <Heart className="w-6 h-6 text-bp-normal" />
                  <h3 className="text-heading-sm">평균 이완기</h3>
                </div>
                <div className="text-center py-2">
                  <div className="text-display-md text-bp-normal font-bold">
                    {stats?.average.diastolic}
                  </div>
                  <div className="text-body-sm text-neutral-400">mmHg</div>
                </div>
              </div>

              {/* 평균 맥박 */}
              <div className="card">
                <div className="flex items-center space-x-3 mb-3">
                  <Activity className="w-6 h-6 text-bp-elevated" />
                  <h3 className="text-heading-sm">평균 맥박</h3>
                </div>
                <div className="text-center py-2">
                  <div className="text-display-md text-bp-elevated font-bold">
                    {stats?.average.pulse}
                  </div>
                  <div className="text-body-sm text-neutral-400">bpm</div>
                </div>
              </div>
            </div>

            {/* 트렌드 차트 */}
            {chartData && (
              <div className="card">
                <div className="h-96">
                  <Line data={chartData} options={chartOptions} />
                </div>
              </div>
            )}

            {/* 혈압 상태 분석 */}
            {stats?.trend && stats.trend.length > 0 && (
              <div className="card">
                <h3 className="text-heading-sm mb-4">혈압 상태 분석</h3>
                <div className="grid grid-cols-2 tablet:grid-cols-4 gap-4">
                  {(() => {
                    const statusCounts = {
                      normal: 0,
                      elevated: 0,
                      high: 0,
                      'very-high': 0,
                    }
                    
                    stats.trend.forEach(reading => {
                      const status = getBPStatus(reading.systolic, reading.diastolic)
                      statusCounts[status.category]++
                    })
                    
                    const total = stats.trend.length
                    
                    return [
                      { key: 'normal', label: '정상', count: statusCounts.normal, color: 'text-bp-normal' },
                      { key: 'elevated', label: '주의', count: statusCounts.elevated, color: 'text-bp-elevated' },
                      { key: 'high', label: '고혈압', count: statusCounts.high, color: 'text-bp-high' },
                      { key: 'very-high', label: '위험', count: statusCounts['very-high'], color: 'text-bp-very-high' },
                    ].map(item => (
                      <div key={item.key} className="text-center">
                        <div className={`text-display-sm font-bold ${item.color}`}>
                          {item.count}
                        </div>
                        <div className="text-body-sm text-neutral-400 mb-1">
                          {item.label}
                        </div>
                        <div className="text-body-sm text-neutral-500">
                          ({Math.round((item.count / total) * 100)}%)
                        </div>
                      </div>
                    ))
                  })()}
                </div>
              </div>
            )}

            {/* 건강 조언 */}
            {stats?.average && (
              <div className="card">
                <h3 className="text-heading-sm mb-4">💡 맞춤 건강 조언</h3>
                <div className="space-y-3">
                  {(() => {
                    const avgStatus = getBPStatus(stats.average.systolic, stats.average.diastolic)
                    const advice = []
                    
                    if (avgStatus.category === 'normal') {
                      advice.push('👍 혈압이 정상 범위입니다. 현재 생활습관을 유지하세요.')
                    } else if (avgStatus.category === 'elevated') {
                      advice.push('⚠️ 혈압이 약간 높습니다. 염분 섭취를 줄이고 운동을 늘려보세요.')
                    } else {
                      advice.push('🚨 혈압이 높습니다. 의사와 상담하시기 바랍니다.')
                    }
                    
                    if (stats.average.pulse > 100) {
                      advice.push('💓 맥박이 빠른 편입니다. 스트레스 관리와 충분한 휴식을 취하세요.')
                    } else if (stats.average.pulse < 60) {
                      advice.push('💙 맥박이 느린 편입니다. 평소 운동을 하시는 분에게는 정상일 수 있습니다.')
                    }
                    
                    return advice.map((text, index) => (
                      <div key={index} className="p-3 bg-neutral-800 rounded-lg">
                        <p className="text-body-md">{text}</p>
                      </div>
                    ))
                  })()}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  )
} 
