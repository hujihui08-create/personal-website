import { Home, Briefcase, MessageCircle, Calendar } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

interface TabItem {
  key: string
  icon: React.ReactNode
  label: string
  path: string
}

const tabs: TabItem[] = [
  { key: 'home', icon: <Home className="w-5 h-5" />, label: '首页', path: '/' },
  { key: 'projects', icon: <Briefcase className="w-5 h-5" />, label: '项目', path: '/projects' },
  { key: 'agent', icon: <MessageCircle className="w-5 h-5" />, label: 'Agent', path: '/agent' },
  { key: 'book', icon: <Calendar className="w-5 h-5" />, label: '预约', path: '/booking' },
]

export const MobileTabBar = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const getActiveKey = () => {
    if (location.pathname === '/') return 'home'
    if (location.pathname.startsWith('/projects')) return 'projects'
    if (location.pathname.startsWith('/agent')) return 'agent'
    if (location.pathname.startsWith('/booking')) return 'book'
    return 'home'
  }

  const activeKey = getActiveKey()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[var(--z-nav)] md:hidden bg-[var(--color-bg)]/95 backdrop-blur border-t border-[var(--color-border-light)]">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center justify-center h-full w-full gap-1 transition-colors
              ${activeKey === tab.key ? 'text-[var(--color-accent)]' : 'text-[var(--color-secondary)] hover:text-[var(--color-primary)]'}`}
            aria-current={activeKey === tab.key ? 'page' : undefined}
          >
            {tab.icon}
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
