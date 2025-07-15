'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import MainLayout from '@/components/layout/main-layout'
import { bpAPI } from '@/lib/supabase'
import { 
  Settings as SettingsIcon, 
  Download, 
  Upload, 
  Trash2, 
  Moon, 
  Sun, 
  Palette,
  Database,
  FileText,
  Info,
  LogOut,
  User
} from 'lucide-react'

interface UserSettings {
  theme: string
  unit_bp: string
  unit_weight: string
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading, signOut } = useAuth()
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'dark',
    unit_bp: 'mmHg',
    unit_weight: 'kg'
  })
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  // 인증 상태 확인
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
      return
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      loadSettings()
    }
  }, [user])

  // 로그인되지 않은 상태
  if (authLoading) {
    return (
      <MainLayout title="설정">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <SettingsIcon className="w-12 h-12 text-primary-500 mx-auto mb-4 animate-pulse" />
            <p className="text-neutral-400">인증 확인 중...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!user) {
    return null // 리다이렉트 중
  }

  const loadSettings = async () => {
    try {
      setLoading(true)
      const { data } = await bpAPI.getUserSettings(user.id)
      if (data) {
        setSettings({
          theme: data.theme,
          unit_bp: data.units_pressure,
          unit_weight: data.units_weight
        })
      }
    } catch (error) {
      console.error('설정 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = async (key: keyof UserSettings, value: string) => {
    try {
      const updatedSettings = { ...settings, [key]: value }
      setSettings(updatedSettings)
      
      // 새 스키마에 맞게 키 변환
      const updateKey = key === 'unit_bp' ? 'units_pressure' : 
                       key === 'unit_weight' ? 'units_weight' : key
      
      await bpAPI.updateUserSettings(user.id, { [updateKey]: value })
    } catch (error) {
      console.error('설정 업데이트 실패:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/auth')
    } catch (error) {
      console.error('로그아웃 실패:', error)
    }
  }

  const exportData = async (format: 'csv' | 'json') => {
    try {
      setExporting(true)
      
      const { data: readings } = await bpAPI.getReadings(user.id)
      
      if (!readings || readings.length === 0) {
        alert('내보낼 데이터가 없습니다.')
        return
      }

      let content: string
      let filename: string
      let mimeType: string

      if (format === 'csv') {
        // CSV 형식
        const headers = ['날짜', '시간', '수축기', '이완기', '맥박', '체중']
        const csvRows = [headers.join(',')]
        
        readings.forEach(reading => {
          const date = new Date(reading.recorded_at)
          const row = [
            date.toLocaleDateString('ko-KR'),
            date.toLocaleTimeString('ko-KR'),
            reading.systolic,
            reading.diastolic,
            reading.pulse,
            reading.weight || ''
          ]
          csvRows.push(row.join(','))
        })
        
        content = csvRows.join('\n')
        filename = `혈압기록_${new Date().toISOString().split('T')[0]}.csv`
        mimeType = 'text/csv;charset=utf-8;'
      } else {
        // JSON 형식
        content = JSON.stringify(readings, null, 2)
        filename = `혈압기록_${new Date().toISOString().split('T')[0]}.json`
        mimeType = 'application/json;charset=utf-8;'
      }

      // 파일 다운로드
      const blob = new Blob([content], { type: mimeType })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()
      
      URL.revokeObjectURL(link.href)
    } catch (error) {
      console.error('데이터 내보내기 실패:', error)
      alert('데이터 내보내기에 실패했습니다.')
    } finally {
      setExporting(false)
    }
  }

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      let data: any[]

      if (file.name.endsWith('.json')) {
        data = JSON.parse(text)
      } else if (file.name.endsWith('.csv')) {
        // 간단한 CSV 파싱 (실제로는 더 정교한 파싱이 필요)
        const lines = text.split('\n')
        const headers = lines[0].split(',')
        data = lines.slice(1).map(line => {
          const values = line.split(',')
          return {
            recorded_at: new Date(`${values[0]} ${values[1]}`).toISOString(),
            systolic: parseInt(values[2]),
            diastolic: parseInt(values[3]),
            pulse: parseInt(values[4]),
            weight: values[5] ? parseFloat(values[5]) : null,
            user_id: user.id
          }
        })
      } else {
        throw new Error('지원되지 않는 파일 형식입니다.')
      }

      // 데이터 검증 및 가져오기
      let importCount = 0
      for (const reading of data) {
        try {
          await bpAPI.addReading(reading)
          importCount++
        } catch (error) {
          console.error('기록 가져오기 실패:', reading, error)
        }
      }

      alert(`${importCount}개의 기록을 성공적으로 가져왔습니다.`)
      
      // 입력 필드 초기화
      event.target.value = ''
    } catch (error) {
      console.error('데이터 가져오기 실패:', error)
      alert('데이터 가져오기에 실패했습니다.')
    }
  }

  const clearAllData = async () => {
    const confirmed = confirm('모든 혈압 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')
    
    if (confirmed) {
      try {
        const { data: readings } = await bpAPI.getReadings(user.id)
        
        if (readings) {
          for (const reading of readings) {
            await bpAPI.deleteReading(reading.id)
          }
        }
        
        alert('모든 데이터가 삭제되었습니다.')
      } catch (error) {
        console.error('데이터 삭제 실패:', error)
        alert('데이터 삭제에 실패했습니다.')
      }
    }
  }

  return (
    <MainLayout title="설정">
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div className="flex items-center space-x-3">
          <SettingsIcon className="w-6 h-6 text-primary-500" />
          <h1 className="text-heading-lg">설정</h1>
        </div>

        {/* 테마 설정 */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <Palette className="w-5 h-5 text-primary-500" />
            <h3 className="text-heading-sm">테마 설정</h3>
          </div>
          
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={settings.theme === 'dark'}
                onChange={(e) => updateSetting('theme', e.target.value)}
                className="w-4 h-4 text-primary-500"
              />
              <Moon className="w-4 h-4" />
              <span>다크 모드</span>
            </label>
            
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="theme"
                value="light"
                checked={settings.theme === 'light'}
                onChange={(e) => updateSetting('theme', e.target.value)}
                className="w-4 h-4 text-primary-500"
              />
              <Sun className="w-4 h-4" />
              <span>라이트 모드</span>
            </label>
          </div>
        </div>

        {/* 단위 설정 */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <SettingsIcon className="w-5 h-5 text-primary-500" />
            <h3 className="text-heading-sm">단위 설정</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-body-sm font-medium mb-2">
                혈압 단위
              </label>
              <select
                value={settings.unit_bp}
                onChange={(e) => updateSetting('unit_bp', e.target.value)}
                className="input-field w-full"
              >
                <option value="mmHg">mmHg</option>
                <option value="kPa">kPa</option>
              </select>
            </div>
            
            <div>
              <label className="block text-body-sm font-medium mb-2">
                체중 단위
              </label>
              <select
                value={settings.unit_weight}
                onChange={(e) => updateSetting('unit_weight', e.target.value)}
                className="input-field w-full"
              >
                <option value="kg">kg</option>
                <option value="lb">lb</option>
              </select>
            </div>
          </div>
        </div>

        {/* 데이터 관리 */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <Database className="w-5 h-5 text-primary-500" />
            <h3 className="text-heading-sm">데이터 관리</h3>
          </div>
          
          <div className="space-y-4">
            {/* 데이터 내보내기 */}
            <div>
              <h4 className="text-body-lg font-medium mb-2">데이터 내보내기</h4>
              <div className="flex space-x-3">
                <button
                  onClick={() => exportData('csv')}
                  disabled={exporting}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>CSV 내보내기</span>
                </button>
                
                <button
                  onClick={() => exportData('json')}
                  disabled={exporting}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>JSON 내보내기</span>
                </button>
              </div>
            </div>

            {/* 데이터 가져오기 */}
            <div>
              <h4 className="text-body-lg font-medium mb-2">데이터 가져오기</h4>
              <label className="btn-secondary flex items-center space-x-2 cursor-pointer inline-flex">
                <Upload className="w-4 h-4" />
                <span>파일 선택</span>
                <input
                  type="file"
                  accept=".csv,.json"
                  onChange={importData}
                  className="hidden"
                />
              </label>
              <p className="text-body-sm text-neutral-400 mt-1">
                CSV 또는 JSON 형식의 파일을 지원합니다
              </p>
            </div>

            {/* 데이터 삭제 */}
            <div className="border-t border-neutral-700 pt-4">
              <h4 className="text-body-lg font-medium mb-2 text-bp-high">위험 구역</h4>
              <button
                onClick={clearAllData}
                className="btn-secondary bg-bp-high hover:bg-red-600 text-white flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>모든 데이터 삭제</span>
              </button>
              <p className="text-body-sm text-neutral-400 mt-1">
                모든 혈압 기록이 영구적으로 삭제됩니다
              </p>
            </div>
          </div>
        </div>

        {/* 계정 정보 */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <User className="w-5 h-5 text-primary-500" />
            <h3 className="text-heading-sm">계정 정보</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-body-md text-neutral-400">이메일</span>
              <span className="text-body-md">{user.email}</span>
            </div>
            
            <div className="pt-3 border-t border-neutral-700">
              <button
                onClick={handleLogout}
                className="btn-secondary bg-red-600 hover:bg-red-700 text-white flex items-center space-x-2 w-full justify-center"
              >
                <LogOut className="w-4 h-4" />
                <span>로그아웃</span>
              </button>
            </div>
          </div>
        </div>

        {/* 앱 정보 */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <Info className="w-5 h-5 text-primary-500" />
            <h3 className="text-heading-sm">앱 정보</h3>
          </div>
          
          <div className="space-y-3 text-body-md text-neutral-400">
            <div className="flex justify-between">
              <span>앱 이름</span>
              <span>혈압 기록</span>
            </div>
            <div className="flex justify-between">
              <span>버전</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>개발자</span>
              <span>혈압 관리팀</span>
            </div>
          </div>
        </div>

        {/* 개인정보 보호 안내 */}
        <div className="card bg-neutral-800 border-primary-500">
          <div className="flex items-start space-x-3">
            <FileText className="w-5 h-5 text-primary-500 mt-1" />
            <div>
              <h3 className="text-heading-sm mb-2">개인정보 보호</h3>
              <p className="text-body-md text-neutral-400">
                모든 혈압 데이터는 귀하의 기기에만 저장되며, 외부로 전송되지 않습니다. 
                데이터 내보내기 시에도 파일은 귀하의 기기에만 저장됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
} 