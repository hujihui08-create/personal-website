import { useNavigate, useLocation, Link } from 'react-router-dom'

interface NavItem {
  key: string
  label: string
  path: string
}

const navItems: NavItem[] = [
  { key: 'home', label: '首页', path: '/' },
  { key: 'projects', label: '项目', path: '/projects' },
  { key: 'agent', label: 'Agent', path: '/agent' },
  { key: 'book', label: '预约', path: '/booking' },
]

export const Navbar = () => {
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
    <header className="fixed top-0 left-0 right-0 z-[var(--z-nav)] bg-[var(--color-bg)]/80 backdrop-blur-md border-b border-[var(--color-border-light)]">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
        <Link to="/" className="text-xl text-[var(--color-primary)]">
          个人主页
        </Link>

        <nav className="hidden md:flex items-center gap-8 flex-1 justify-center">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              className={`text-base font-medium transition-colors
                ${activeKey === item.key ? 'text-[var(--color-accent)]' : 'text-[var(--color-secondary)] hover:text-[var(--color-primary)]'}`}
              aria-current={activeKey === item.key ? 'page' : undefined}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex items-center">
          <Link
            to="/admin/login"
            className="h-10 px-5 bg-[var(--color-primary)] text-[var(--color-bg)] rounded-[var(--radius-sm)] text-sm font-medium flex items-center
              hover:bg-[var(--color-secondary)] transition-colors"
          >
            管理后台
          </Link>
        </div>
      </div>
    </header>
  )
}
