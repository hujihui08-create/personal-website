import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, User, Briefcase, FolderOpen, LogOut, Menu, X, Bug, FileText } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/stores/auth'

interface NavItem {
  key: string
  label: string
  path: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { key: 'dashboard', label: '仪表盘', path: '/admin/dashboard', icon: Home },
  { key: 'profile', label: '个人资料', path: '/admin/profile', icon: User },
  { key: 'experiences', label: '工作经历', path: '/admin/experiences', icon: Briefcase },
  { key: 'projects', label: '项目管理', path: '/admin/projects', icon: FolderOpen },
  { key: 'agent-debug', label: 'Agent 调试', path: '/admin/agent/debug', icon: Bug },
  { key: 'agent-prompts', label: 'Prompt 管理', path: '/admin/agent/prompts', icon: FileText },
]

export const AdminSidebar = () => {
  const location = useLocation()
  const logout = useAuthStore((state) => state.logout)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isActive = (path: string) => location.pathname === path

  const navContent = (
    <nav className="flex flex-col h-full">
      <div className="p-[var(--space-md)] border-b border-[var(--color-border-light)]">
        <Link to="/" className="text-lg font-semibold text-[var(--color-primary)]">
          管理后台
        </Link>
      </div>

      <div className="flex-1 p-[var(--space-md)] space-y-[var(--space-sm)]">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.key}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-[var(--space-sm)] px-[var(--space-md)] py-[var(--space-sm)] rounded-[var(--radius-md)] transition-all duration-[var(--duration-base)] ease-[var(--easing-standard)] min-h-11
                ${
                  isActive(item.path)
                    ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                    : 'text-[var(--color-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-bg-secondary)]'
                }`}
              aria-current={isActive(item.path) ? 'page' : undefined}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>

      <div className="p-[var(--space-md)] border-t border-[var(--color-border-light)]">
        <button
          onClick={logout}
          className="flex items-center gap-[var(--space-sm)] px-[var(--space-md)] py-[var(--space-sm)] rounded-[var(--radius-md)] text-[var(--color-secondary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-all duration-[var(--duration-base)] ease-[var(--easing-standard)] min-h-11 w-full"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">退出登录</span>
        </button>
      </div>
    </nav>
  )

  return (
    <>
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[var(--color-bg)] border-b border-[var(--color-border-light)] z-[var(--z-nav)] flex items-center justify-between px-[var(--space-md)]">
        <Link to="/" className="text-lg font-semibold text-[var(--color-primary)]">
          管理后台
        </Link>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--color-bg-secondary)] transition-colors"
          aria-label={isMobileMenuOpen ? '关闭菜单' : '打开菜单'}
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-60 bg-[var(--color-bg)] border-r border-[var(--color-border-light)] z-[var(--z-nav)]">
        {navContent}
      </aside>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-[calc(var(--z-nav)-1)]"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isMobileMenuOpen ? 0 : '-100%' }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="md:hidden fixed left-0 top-16 bottom-0 w-60 bg-[var(--color-bg)] border-r border-[var(--color-border-light)] z-[var(--z-nav)]"
      >
        {navContent}
      </motion.aside>
    </>
  )
}
