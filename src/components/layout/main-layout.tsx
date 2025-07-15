'use client'

import { ReactNode } from 'react'
import BottomNav, { QuickAddFab } from './bottom-nav'
import TopBar from './top-bar'

interface MainLayoutProps {
  children: ReactNode
  title?: string
  showQuickAdd?: boolean
}

export default function MainLayout({ 
  children, 
  title = '혈압 기록',
  showQuickAdd = true 
}: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-900">
      {/* 데스크톱 상단 바 */}
      <TopBar title={title} />
      
      {/* 메인 콘텐츠 */}
      <main className="pb-20 desktop:pb-8 desktop:pt-16">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </div>
      </main>
      
      {/* 모바일 하단 네비게이션 */}
      <div className="desktop:hidden">
        <BottomNav />
      </div>
      
      {/* 빠른 추가 플로팅 버튼 */}
      {showQuickAdd && <QuickAddFab />}
    </div>
  )
} 