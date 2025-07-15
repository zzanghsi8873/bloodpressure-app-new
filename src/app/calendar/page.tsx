'use client'

import { useEffect, useState } from 'react'
import MainLayout from '@/components/layout/main-layout'
import { bpAPI, getBPStatus } from '@/lib/supabase'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import { EventClickArg, DateSelectArg } from '@fullcalendar/core'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'

// 임시 사용자 ID
const TEMP_USER_ID = '123e4567-e89b-12d3-a456-426614174000'

interface CalendarEvent {
  id: string
  title: string
  date: string
  extendedProps: {
    systolic: number
    diastolic: number
    pulse: number
    weight?: number
    status: string
  }
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  useEffect(() => {
    loadCalendarData()
  }, [selectedDate])

  const loadCalendarData = async () => {
    try {
      setLoading(true)
      
      // 현재 월의 시작과 끝 날짜 계산
      const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
      const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
      
      const { data: readings } = await bpAPI.getReadings(
        TEMP_USER_ID,
        startOfMonth.toISOString(),
        endOfMonth.toISOString()
      )

      if (readings) {
        const calendarEvents: CalendarEvent[] = readings.map(reading => {
          const status = getBPStatus(reading.systolic, reading.diastolic)
          
          return {
            id: reading.id,
            title: `${reading.systolic}/${reading.diastolic}`,
            date: reading.recorded_at.split('T')[0], // YYYY-MM-DD 형식
            extendedProps: {
              systolic: reading.systolic,
              diastolic: reading.diastolic,
              pulse: reading.pulse,
              weight: reading.weight,
              status: status.label
            }
          }
        })
        
        setEvents(calendarEvents)
      }
    } catch (error) {
      console.error('캘린더 데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateClick = (info: DateSelectArg) => {
    // 날짜 클릭 시 해당 날짜의 기록 표시 또는 새 기록 추가
    console.log('Date clicked:', info.startStr)
  }

  const handleEventClick = (info: EventClickArg) => {
    // 이벤트 클릭 시 상세 정보 표시
    const { extendedProps } = info.event
    alert(`
      혈압: ${extendedProps.systolic}/${extendedProps.diastolic} mmHg
      맥박: ${extendedProps.pulse} bpm
      상태: ${extendedProps.status}
      ${extendedProps.weight ? `체중: ${extendedProps.weight} kg` : ''}
    `)
  }

  return (
    <MainLayout title="캘린더">
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CalendarIcon className="w-6 h-6 text-primary-500" />
            <h1 className="text-heading-lg">혈압 캘린더</h1>
          </div>
          
          <div className="text-body-sm text-neutral-400">
            {events.length}개의 기록
          </div>
        </div>

        {/* 캘린더 */}
        <div className="card">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <CalendarIcon className="w-12 h-12 text-primary-500 mx-auto mb-4 animate-pulse" />
                <p className="text-neutral-400">캘린더를 불러오는 중...</p>
              </div>
            </div>
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin]}
              initialView="dayGridMonth"
              locale="ko"
              height="auto"
              headerToolbar={{
                left: 'prev',
                center: 'title',
                right: 'next'
              }}
              events={events}
              selectable={true}
              select={handleDateClick}
              eventClick={handleEventClick}
              eventContent={(eventInfo) => {
                const { extendedProps } = eventInfo.event
                const status = getBPStatus(extendedProps.systolic, extendedProps.diastolic)
                
                return (
                  <div className={`p-1 text-xs rounded ${status.color} bg-opacity-20`}>
                    <div className="font-bold">
                      {extendedProps.systolic}/{extendedProps.diastolic}
                    </div>
                    <div className="opacity-75">
                      {extendedProps.pulse}bpm
                    </div>
                  </div>
                )
              }}
              dayCellContent={(dayInfo) => {
                const dayEvents = events.filter(event => 
                  event.date === dayInfo.date.toISOString().split('T')[0]
                )
                
                return (
                  <div className="relative">
                    <div className="text-center p-2">
                      {dayInfo.dayNumberText}
                    </div>
                    {dayEvents.length > 0 && (
                      <div className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full"></div>
                    )}
                  </div>
                )
              }}
            />
          )}
        </div>

        {/* 범례 */}
        <div className="card">
          <h3 className="text-heading-sm mb-4">혈압 상태 범례</h3>
          <div className="grid grid-cols-2 tablet:grid-cols-4 gap-3">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-bp-normal rounded"></div>
              <span className="text-body-sm">정상 (120/80 미만)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-bp-elevated rounded"></div>
              <span className="text-body-sm">주의 (130/80 미만)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-bp-high rounded"></div>
              <span className="text-body-sm">고혈압 (140/90 미만)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-bp-very-high rounded"></div>
              <span className="text-body-sm">위험 (140/90 이상)</span>
            </div>
          </div>
        </div>

        {/* 월간 요약 */}
        {events.length > 0 && (
          <div className="card">
            <h3 className="text-heading-sm mb-4">이번 달 요약</h3>
            <div className="grid grid-cols-2 tablet:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-display-sm text-primary-500 font-bold">
                  {events.length}
                </div>
                <div className="text-body-sm text-neutral-400">총 기록</div>
              </div>
              <div>
                <div className="text-display-sm text-bp-normal font-bold">
                  {events.filter(e => getBPStatus(e.extendedProps.systolic, e.extendedProps.diastolic).category === 'normal').length}
                </div>
                <div className="text-body-sm text-neutral-400">정상</div>
              </div>
              <div>
                <div className="text-display-sm text-bp-elevated font-bold">
                  {events.filter(e => getBPStatus(e.extendedProps.systolic, e.extendedProps.diastolic).category === 'elevated').length}
                </div>
                <div className="text-body-sm text-neutral-400">주의</div>
              </div>
              <div>
                <div className="text-display-sm text-bp-high font-bold">
                  {events.filter(e => ['high', 'very-high'].includes(getBPStatus(e.extendedProps.systolic, e.extendedProps.diastolic).category)).length}
                </div>
                <div className="text-body-sm text-neutral-400">고혈압</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
} 