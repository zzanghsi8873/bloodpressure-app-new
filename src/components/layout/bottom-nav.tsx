'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, TrendingUp, Settings, Plus } from 'lucide-react'

const navItems = [
  { href: '/', icon: Home, label: '대시보드' },
  { href: '/calendar', icon: Calendar, label: '캘린더' },
  { href: '/stats', icon: TrendingUp, label: '통계' },
  { href: '/settings', icon: Settings, label: '설정' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-700 safe-area-pb-2 z-40">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-tab ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

// 빠른 추가 플로팅 액션 버튼
export function QuickAddFab() {
  return (
    <Link
      href="/add"
      className="fixed bottom-20 right-4 w-14 h-14 bg-primary-500 rounded-full flex items-center justify-center shadow-lg hover:bg-primary-400 active:bg-primary-600 transition-colors duration-200 z-50"
    >
      <Plus className="w-6 h-6 text-neutral-900" />
    </Link>
  )
} 