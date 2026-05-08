import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Home, User, Briefcase, FolderOpen, LogOut } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { useLocation } from 'react-router-dom'

interface AdminLayoutProps {
  children: React.ReactNode
}

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
  { key: 'projects', label: '作品管理', path: '/admin/projects', icon: FolderOpen },
]

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation()
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isActive = (path: string) => location.pathname === path

  const handleLogout = async () => {
    await logout()
    setIsMobileMenuOpen(false)
    navigate('/')
  }

  const navContent = (
    <nav className="flex flex-col h-full">
      <div className="flex-1 p-[var(--space-md)] space-y-[var(--space-xs)]">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)
          return (
            <Link
              key={item.key}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`group flex items-center gap-[var(--space-sm)] px-[var(--space-md)] py-[var(--space-sm)] rounded-[var(--radius-md)] transition-all duration-[var(--duration-base)] ease-[var(--easing-standard)]
                ${active
                  ? 'bg-[var(--color-accent)] text-[var(--color-bg)] shadow-sm'
                  : 'text-[var(--color-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-bg-secondary)]'
                }`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className={`w-5 h-5 transition-transform duration-[var(--duration-base)] ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>

      <div className="p-[var(--space-md)] border-t border-[var(--color-border-light)]">
        <button
          onClick={handleLogout}
          className="group flex items-center gap-[var(--space-sm)] px-[var(--space-md)] py-[var(--space-sm)] rounded-[var(--radius-md)] text-[var(--color-secondary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-all duration-[var(--duration-base)] ease-[var(--easing-standard)] w-full"
        >
          <LogOut className="w-5 h-5 transition-transform duration-[var(--duration-base)] group-hover:scale-110" />
          <span className="text-sm font-medium">退出登录</span>
        </button>
      </div>
    </nav>
  )

  return (
    <div className="min-h-screen bg-[var(--color-bg-tertiary)]">
      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[var(--color-bg)]/95 backdrop-blur-sm border-b border-[var(--color-border-light)] z-[var(--z-nav)] flex items-center justify-between px-[var(--space-md)]">
        <Link
          to="/admin/dashboard"
          className="flex items-center gap-2"
        >
          <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-accent)] flex items-center justify-center">
            <Home className="w-5 h-5 text-[var(--color-bg)]" />
          </div>
          <span className="text-lg font-semibold text-[var(--color-primary)]">管理后台</span>
        </Link>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--color-bg-secondary)] transition-colors"
          aria-label={isMobileMenuOpen ? '关闭菜单' : '打开菜单'}
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-[var(--color-bg)] border-r border-[var(--color-border-light)] z-[var(--z-nav)] shadow-sm">
        <div className="flex-1 flex flex-col">
          <div className="h-16 flex items-center px-[var(--space-md)] border-b border-[var(--color-border-light)]">
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-accent)] flex items-center justify-center">
                <Home className="w-5 h-5 text-[var(--color-bg)]" />
              </div>
              <span className="text-lg font-semibold text-[var(--color-primary)]">管理后台</span>
            </Link>
          </div>
          {navContent}
        </div>
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 bg-black/40 z-[calc(var(--z-nav)-1)]"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="md:hidden fixed left-0 top-16 bottom-0 w-64 bg-[var(--color-bg)] border-r border-[var(--color-border-light)] z-[var(--z-nav)] shadow-lg"
          >
            {navContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="md:ml-64 pt-16 md:pt-0 min-h-screen">
        <div className="max-w-7xl mx-auto px-[var(--space-md)] md:px-[var(--space-lg)] py-[var(--space-lg)] md:py-[var(--space-xl)]">
          {children}
        </div>
      </main>
    </div>
  )
}
