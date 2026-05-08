import { HeroCard } from '@/components/HeroCard'
import { WorkExperienceTimeline } from '@/components/WorkExperienceTimeline'
import { useProfile } from '@/hooks/useProfile'
import { useExperiences } from '@/hooks/useExperiences'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'

export const HomePage = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
    refetch: refetchProfile,
  } = useProfile()
  const {
    data: experiences,
    isLoading: experiencesLoading,
    isError: experiencesError,
    refetch: refetchExperiences,
  } = useExperiences()

  const isError = profileError || experiencesError
  const isEmptyContent =
    !profileLoading &&
    !experiencesLoading &&
    !isError &&
    !profile &&
    Array.isArray(experiences) &&
    experiences.length === 0

  if (isError) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-tertiary)]">
        <main className="max-w-4xl mx-auto px-[var(--space-md)] py-[var(--space-2xl)]">
          <div className="flex flex-col items-center justify-center py-[var(--space-3xl)] text-center">
            <div className="w-16 h-16 rounded-[var(--radius-full)] bg-[var(--color-error)]/10 flex items-center justify-center mb-[var(--space-md)]">
              <AlertCircle className="w-8 h-8 text-[var(--color-error)]" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--color-primary)] mb-2">
              加载失败
            </h2>
            <p className="text-sm text-[var(--color-secondary)] mb-[var(--space-lg)]">
              数据加载出错，请检查网络连接后重试
            </p>
            <button
              onClick={() => {
                refetchProfile()
                refetchExperiences()
              }}
              className="inline-flex items-center gap-2 h-11 px-[var(--space-md)] bg-[var(--color-primary)] text-[var(--color-bg)] rounded-[var(--radius-sm)] text-sm font-medium
                hover:bg-[var(--color-secondary)] transition-all duration-[var(--duration-base)] ease-standard
                focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>重新加载</span>
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (isEmptyContent) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-tertiary)]">
        <main className="max-w-4xl mx-auto px-[var(--space-md)] py-[var(--space-2xl)]">
          <div className="bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)] p-[var(--space-xl)] text-center">
            <h1 className="text-xl font-semibold text-[var(--color-primary)] mb-2">
              暂无可展示内容
            </h1>
            <p className="text-sm text-[var(--color-secondary)]">
              个人资料与工作经历还未填写，请稍后查看或联系管理员补充信息。
            </p>
            <div className="mt-[var(--space-lg)] flex flex-wrap justify-center gap-3">
              <Link
                to={isAuthenticated ? '/admin/profile' : '/admin/login'}
                className="inline-flex items-center gap-2 h-11 px-[var(--space-md)] bg-[var(--color-primary)] text-[var(--color-bg)] rounded-[var(--radius-sm)] text-sm font-medium
                  hover:bg-[var(--color-secondary)] transition-all duration-[var(--duration-base)] ease-standard
                  focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2"
              >
                {isAuthenticated ? '进入后台编辑资料' : '管理员登录去添加内容'}
              </Link>
              <Link
                to="/admin/experiences"
                className="inline-flex items-center gap-2 h-11 px-[var(--space-md)] border border-[var(--color-border-medium)] text-[var(--color-primary)] rounded-[var(--radius-sm)] text-sm font-medium
                  hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] transition-all duration-[var(--duration-base)] ease-standard
                  focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2"
              >
                去管理工作经历
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-tertiary)]">
      <main className="max-w-4xl mx-auto px-[var(--space-md)] py-[var(--space-md)] md:py-[var(--space-xl)] space-y-[var(--space-lg)] md:space-y-[var(--space-xl)]">
        {/* Hero Section */}
        <HeroCard profile={profile} isLoading={profileLoading} />

        {/* Work Experience Timeline */}
        <WorkExperienceTimeline
          experiences={experiences}
          isLoading={experiencesLoading}
        />
      </main>
    </div>
  )
}

export default HomePage
