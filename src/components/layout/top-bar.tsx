'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus, Activity } from 'lucide-react'

interface TopBarProps {
  title: string
}

const navItems = [
  { href: '/', label: '대시보드' },
  { href: '/calendar', label: '캘린더' },
  { href: '/stats', label: '통계' },
  { href: '/settings', label: '설정' },
]

export default function TopBar({ title }: TopBarProps) {
  const pathname = usePathname()

  return (
    <header className="hidden desktop:block fixed top-0 left-0 right-0 bg-neutral-900 border-b border-neutral-700 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* 로고 */}
          <Link href="/" className="flex items-center space-x-2">
            <Activity className="w-6 h-6 text-primary-500" />
            <span className="text-heading-md font-bold">{title}</span>
          </Link>
          
          {/* 데스크톱 네비게이션 */}
          <nav className="flex items-center space-x-8">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-body-md font-medium transition-colors duration-200 ${
                    isActive 
                      ? 'text-primary-500' 
                      : 'text-neutral-300 hover:text-neutral-100'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
          
          {/* 빠른 추가 버튼 */}
          <Link
            href="/add"
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>기록 추가</span>
          </Link>
        </div>
      </div>
    </header>
  )
} 