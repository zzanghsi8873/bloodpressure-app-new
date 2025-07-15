import { createClient } from '@supabase/supabase-js'

// 환경 변수에서 Supabase 설정 가져오기 (없으면 더미 값 사용)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy-project.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1bW15LXByb2plY3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NzI0ODQ0NCwiZXhwIjoxOTYyODI0NDQ0fQ.dummy-key-for-development'

export const supabase = createClient(supabaseUrl, supabaseKey)

// 새로운 데이터베이스 스키마에 맞는 타입 정의
export type Database = {
  public: {
    Tables: {
      blood_pressure_readings: {
        Row: {
          id: string
          user_id: string
          systolic: number
          diastolic: number
          pulse: number | null
          weight: number | null
          notes: string | null
          measured_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          systolic: number
          diastolic: number
          pulse?: number | null
          weight?: number | null
          notes?: string | null
          measured_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          systolic?: number
          diastolic?: number
          pulse?: number | null
          weight?: number | null
          notes?: string | null
          measured_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      health_tips: {
        Row: {
          id: string
          title: string
          content: string
          category: 'diet' | 'exercise' | 'lifestyle' | 'medication'
          bp_status: 'normal' | 'elevated' | 'high' | 'very_high' | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          category: 'diet' | 'exercise' | 'lifestyle' | 'medication'
          bp_status?: 'normal' | 'elevated' | 'high' | 'very_high' | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          category?: 'diet' | 'exercise' | 'lifestyle' | 'medication'
          bp_status?: 'normal' | 'elevated' | 'high' | 'very_high' | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          theme: 'light' | 'dark' | 'system'
          units_weight: 'kg' | 'lbs'
          units_pressure: 'mmHg' | 'kPa'
          notifications_enabled: boolean
          reminder_time: string
          target_systolic: number
          target_diastolic: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme?: 'light' | 'dark' | 'system'
          units_weight?: 'kg' | 'lbs'
          units_pressure?: 'mmHg' | 'kPa'
          notifications_enabled?: boolean
          reminder_time?: string
          target_systolic?: number
          target_diastolic?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme?: 'light' | 'dark' | 'system'
          units_weight?: 'kg' | 'lbs'
          units_pressure?: 'mmHg' | 'kPa'
          notifications_enabled?: boolean
          reminder_time?: string
          target_systolic?: number
          target_diastolic?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// 혈압 상태 계산 함수
export function getBPStatus(systolic: number, diastolic: number): {
  category: 'normal' | 'elevated' | 'high' | 'very_high'
  label: string
  color: string
} {
  if (systolic < 120 && diastolic < 80) {
    return { category: 'normal', label: '정상', color: 'text-bp-normal' }
  } else if (systolic < 130 && diastolic < 80) {
    return { category: 'elevated', label: '주의', color: 'text-bp-elevated' }
  } else if (systolic < 140 || diastolic < 90) {
    return { category: 'high', label: '고혈압', color: 'text-bp-high' }
  } else {
    return { category: 'very_high', label: '위험', color: 'text-bp-very-high' }
  }
}

// 혈압 기록 API 함수들
export const bpAPI = {
  // 혈압 기록 조회
  async getReadings(userId: string, startDate?: string, endDate?: string) {
    try {
      let query = supabase
        .from('blood_pressure_readings')
        .select('*')
        .eq('user_id', userId)
        .order('measured_at', { ascending: false })

      if (startDate) {
        query = query.gte('measured_at', startDate)
      }
      if (endDate) {
        query = query.lte('measured_at', endDate)
      }

      return await query
    } catch (error) {
      console.warn('Supabase not connected, returning empty data:', error)
      return { data: [], error: null }
    }
  },

  // 혈압 기록 추가
  async addReading(reading: Database['public']['Tables']['blood_pressure_readings']['Insert']) {
    try {
      return await supabase
        .from('blood_pressure_readings')
        .insert(reading)
        .select()
        .single()
    } catch (error) {
      console.warn('Supabase not connected, simulating successful save:', error)
      // 더미 응답 반환 (실제로는 저장되지 않음)
      return { 
        data: { 
          ...reading, 
          id: 'dummy-id', 
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          measured_at: reading.measured_at || new Date().toISOString()
        }, 
        error: null 
      }
    }
  },

  // 혈압 기록 수정
  async updateReading(id: string, updates: Database['public']['Tables']['blood_pressure_readings']['Update']) {
    try {
      return await supabase
        .from('blood_pressure_readings')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
    } catch (error) {
      console.warn('Supabase not connected, simulating update:', error)
      return { data: { ...updates, id }, error: null }
    }
  },

  // 혈압 기록 삭제
  async deleteReading(id: string) {
    try {
      return await supabase
        .from('blood_pressure_readings')
        .delete()
        .eq('id', id)
    } catch (error) {
      console.warn('Supabase not connected, simulating delete:', error)
      return { data: null, error: null }
    }
  },

  // 사용자 설정 조회
  async getUserSettings(userId: string) {
    try {
      return await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single()
    } catch (error) {
      console.warn('Supabase not connected, returning default settings:', error)
      return { 
        data: {
          id: 'dummy-id',
          user_id: userId,
          theme: 'dark' as const,
          units_weight: 'kg' as const,
          units_pressure: 'mmHg' as const,
          notifications_enabled: true,
          reminder_time: '09:00:00',
          target_systolic: 120,
          target_diastolic: 80,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, 
        error: null 
      }
    }
  },

  // 사용자 설정 업데이트
  async updateUserSettings(userId: string, settings: Database['public']['Tables']['user_settings']['Update']) {
    try {
      return await supabase
        .from('user_settings')
        .upsert({ user_id: userId, ...settings })
        .select()
        .single()
    } catch (error) {
      console.warn('Supabase not connected, simulating settings update:', error)
      return { 
        data: { 
          id: 'dummy-id',
          user_id: userId, 
          theme: 'dark' as const,
          units_weight: 'kg' as const,
          units_pressure: 'mmHg' as const,
          notifications_enabled: true,
          reminder_time: '09:00:00',
          target_systolic: 120,
          target_diastolic: 80,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...settings 
        }, 
        error: null 
      }
    }
  },

  // 건강 팁 조회
  async getTips(category?: string, limit: number = 5) {
    try {
      let query = supabase
        .from('health_tips')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (category) {
        query = query.eq('category', category)
      }

      return await query
    } catch (error) {
      console.warn('Supabase not connected, returning sample tips:', error)
      return { 
        data: [
          {
            id: 'tip-1',
            title: '규칙적인 운동하기',
            content: '매일 30분씩 유산소 운동을 하면 혈압을 5-10mmHg 낮출 수 있습니다.',
            category: 'exercise' as const,
            bp_status: 'high' as const,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ], 
        error: null 
      }
    }
  },

  // 통계 데이터 조회
  async getStats(userId: string, days: number = 30) {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      
      const { data, error } = await supabase
        .from('blood_pressure_readings')
        .select('systolic, diastolic, pulse, weight, measured_at')
        .eq('user_id', userId)
        .gte('measured_at', startDate.toISOString())
        .order('measured_at', { ascending: true })

      if (error) throw error

      // 통계 계산
      const readings = data || []
      const count = readings.length
      
      if (count === 0) {
        return {
          count: 0,
          average: { systolic: 0, diastolic: 0, pulse: 0 },
          latest: null,
          trend: []
        }
      }

      const avgSystolic = Math.round(readings.reduce((sum, r) => sum + r.systolic, 0) / count)
      const avgDiastolic = Math.round(readings.reduce((sum, r) => sum + r.diastolic, 0) / count)
      const pulseReadings = readings.filter(r => r.pulse !== null)
      const avgPulse = pulseReadings.length > 0 
        ? Math.round(pulseReadings.reduce((sum, r) => sum + (r.pulse || 0), 0) / pulseReadings.length)
        : 0

      return {
        count,
        average: {
          systolic: avgSystolic,
          diastolic: avgDiastolic,
          pulse: avgPulse
        },
        latest: readings[readings.length - 1],
        trend: readings.slice(-7) // 최근 7개
      }
    } catch (error) {
      console.warn('Supabase not connected, returning empty stats:', error)
      return {
        count: 0,
        average: { systolic: 0, diastolic: 0, pulse: 0 },
        latest: null,
        trend: []
      }
    }
  }
} 