import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HeroCard } from '@/components/HeroCard'
import type { Profile } from '@/types'

// ── Hoisted mocks ──────────────────────────────────────────────

const mockUseResume = vi.hoisted(() => vi.fn())

vi.mock('@/hooks/useResume', () => ({
  useResume: mockUseResume,
}))

vi.mock('framer-motion', () => {
  const { createElement, forwardRef } = require('react')
  const motion = new Proxy(
    {},
    {
      get: (_target: any, tag: string) =>
        forwardRef(({ children, ...props }: any, ref: any) => {
          // Filter out framer-motion-specific animation props
          const {
            initial,
            animate,
            whileInView,
            viewport,
            transition,
            whileHover,
            whileTap,
            exit,
            layout,
            variants,
            ...rest
          } = props
          return createElement(tag, { ...rest, ref }, children)
        }),
    }
  )
  return { motion }
})

vi.mock('lucide-react', () => {
  const { createElement } = require('react')
  const icons = ['Github', 'ExternalLink', 'Mail', 'Download', 'Eye', 'Calendar']
  const result: Record<string, any> = {}
  icons.forEach((name) => {
    result[name] = (props: any) =>
      createElement('svg', { ...props, 'data-testid': `icon-${name.toLowerCase()}` })
  })
  return result
})

// ── Tests ──────────────────────────────────────────────────────

describe('HeroCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Loading state ──

  it('should render skeleton when isLoading prop is true', () => {
    mockUseResume.mockReturnValue({ data: null, isLoading: false })

    const { container } = render(<HeroCard isLoading={true} />)

    // Skeleton uses animate-pulse class
    const skeletonElements = container.querySelectorAll('.animate-pulse')
    expect(skeletonElements.length).toBeGreaterThan(0)
  })

  it('should render skeleton when useResume is loading', () => {
    mockUseResume.mockReturnValue({ data: null, isLoading: true })

    const { container } = render(<HeroCard />)

    const skeletonElements = container.querySelectorAll('.animate-pulse')
    expect(skeletonElements.length).toBeGreaterThan(0)
  })

  it('should render skeleton when both isLoading and useResume are loading', () => {
    mockUseResume.mockReturnValue({ data: null, isLoading: true })

    const { container } = render(<HeroCard isLoading={true} />)

    const skeletonElements = container.querySelectorAll('.animate-pulse')
    expect(skeletonElements.length).toBeGreaterThan(0)
  })

  // ── Null / fallback state ──

  it('should return null when no profile is provided and not loading', () => {
    mockUseResume.mockReturnValue({ data: null, isLoading: false })

    const { container } = render(<HeroCard />)

    expect(container.innerHTML).toBe('')
  })

  // ── Normal render state ──

  it('should render profile name and title', () => {
    const profile: Profile = {
      name: '张三',
      title: '全栈工程师',
      bio: '热爱编程与技术分享',
      avatarUrl: 'https://example.com/avatar.png',
      githubUrl: 'https://github.com/zhangsan',
      linkedinUrl: 'https://linkedin.com/in/zhangsan',
      email: 'zhangsan@example.com',
      skills: ['React', 'TypeScript', 'Go'],
    }
    mockUseResume.mockReturnValue({ data: null, isLoading: false })

    render(<HeroCard profile={profile} />)

    expect(screen.getByText('张三')).toBeInTheDocument()
    expect(screen.getByText('全栈工程师')).toBeInTheDocument()
  })

  it('should render bio when provided', () => {
    const profile: Profile = {
      name: '张三',
      title: '全栈工程师',
      bio: '热爱编程与技术分享',
      avatarUrl: '',
      githubUrl: '',
      linkedinUrl: '',
      email: '',
      skills: [],
    }
    mockUseResume.mockReturnValue({ data: null, isLoading: false })

    render(<HeroCard profile={profile} />)

    expect(screen.getByText('热爱编程与技术分享')).toBeInTheDocument()
  })

  it('should render avatar image when avatarUrl is provided', () => {
    const profile: Profile = {
      name: '张三',
      title: '全栈工程师',
      bio: '',
      avatarUrl: 'https://example.com/avatar.png',
      githubUrl: '',
      linkedinUrl: '',
      email: '',
      skills: [],
    }
    mockUseResume.mockReturnValue({ data: null, isLoading: false })

    render(<HeroCard profile={profile} />)

    const img = screen.getByAltText('张三的头像')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.png')
  })

  it('should render initials fallback when avatarUrl is empty', () => {
    const profile: Profile = {
      name: '张三',
      title: '全栈工程师',
      bio: '',
      avatarUrl: '',
      githubUrl: '',
      linkedinUrl: '',
      email: '',
      skills: [],
    }
    mockUseResume.mockReturnValue({ data: null, isLoading: false })

    render(<HeroCard profile={profile} />)

    // The fallback renders the first character of the name
    expect(screen.getByText('张')).toBeInTheDocument()
  })

  it('should render skill tags', () => {
    const profile: Profile = {
      name: '张三',
      title: '全栈工程师',
      bio: '',
      avatarUrl: '',
      githubUrl: '',
      linkedinUrl: '',
      email: '',
      skills: ['React', 'TypeScript', 'Go'],
    }
    mockUseResume.mockReturnValue({ data: null, isLoading: false })

    render(<HeroCard profile={profile} />)

    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getByText('Go')).toBeInTheDocument()
  })

  it('should render social links for github, linkedin and email', () => {
    const profile: Profile = {
      name: '张三',
      title: '全栈工程师',
      bio: '',
      avatarUrl: '',
      githubUrl: 'https://github.com/zhangsan',
      linkedinUrl: 'https://linkedin.com/in/zhangsan',
      email: 'zhangsan@example.com',
      skills: [],
    }
    mockUseResume.mockReturnValue({ data: null, isLoading: false })

    render(<HeroCard profile={profile} />)

    expect(screen.getByText('https://github.com/zhangsan')).toBeInTheDocument()
    expect(screen.getByText('https://linkedin.com/in/zhangsan')).toBeInTheDocument()
    expect(screen.getByText('zhangsan@example.com')).toBeInTheDocument()
  })

  it('should render resume download link when resume data is available', () => {
    const profile: Profile = {
      name: '张三',
      title: '全栈工程师',
      bio: '',
      avatarUrl: '',
      githubUrl: '',
      linkedinUrl: '',
      email: '',
      skills: [],
    }
    mockUseResume.mockReturnValue({
      data: { file_url: 'https://example.com/resume.pdf', file_name: 'resume.pdf' },
      isLoading: false,
    })

    render(<HeroCard profile={profile} />)

    const downloadLink = screen.getByText('下载简历')
    expect(downloadLink).toBeInTheDocument()
    expect(downloadLink.closest('a')).toHaveAttribute('href', 'https://example.com/resume.pdf')
  })

  it('should NOT render resume download link when resume data is null', () => {
    const profile: Profile = {
      name: '张三',
      title: '全栈工程师',
      bio: '',
      avatarUrl: '',
      githubUrl: '',
      linkedinUrl: '',
      email: '',
      skills: [],
    }
    mockUseResume.mockReturnValue({ data: null, isLoading: false })

    render(<HeroCard profile={profile} />)

    expect(screen.queryByText('下载简历')).not.toBeInTheDocument()
  })

  it('should render action buttons (查看作品 and 预约面试)', () => {
    const profile: Profile = {
      name: '张三',
      title: '全栈工程师',
      bio: '',
      avatarUrl: '',
      githubUrl: '',
      linkedinUrl: '',
      email: '',
      skills: [],
    }
    mockUseResume.mockReturnValue({ data: null, isLoading: false })

    render(<HeroCard profile={profile} />)

    expect(screen.getByText('查看作品')).toBeInTheDocument()
    expect(screen.getByText('预约面试')).toBeInTheDocument()
  })
})
