import { useState } from 'react'
import { AlertCircle, RefreshCw, FolderOpen } from 'lucide-react'
import { ProjectCard } from '@/components/ProjectCard'
import { useProjects } from '@/hooks/useProjects'

const Skeleton = ({ className }: { className?: string }) => (
  <div
    className={`animate-pulse bg-[var(--color-bg-secondary)] rounded-[var(--radius-xl)] ${className ?? ''}`}
  />
)

const ProjectCardSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="aspect-[16/10] rounded-[var(--radius-xl)]" />
    <div className="space-y-2">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-16 w-full" />
    </div>
  </div>
)

export const ProjectsPage = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'enterprise' | 'personal'>('all')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 12

  const {
    data: projectsData,
    isLoading,
    isError,
    refetch,
  } = useProjects({
    type: activeTab === 'all' ? undefined : activeTab,
    page,
    pageSize: PAGE_SIZE,
  })

  const projects = projectsData?.items ?? []
  const totalPages = projectsData ? Math.ceil(projectsData.total / PAGE_SIZE) : 0

  const tabs = [
    { key: 'all', label: '全部' },
    { key: 'enterprise', label: '企业项目' },
    { key: 'personal', label: '个人项目' },
  ] as const

  if (isError) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-tertiary)]">
        <main className="max-w-6xl mx-auto px-[var(--space-md)] py-[var(--space-2xl)]">
          <div className="flex flex-col items-center justify-center py-[var(--space-3xl)] text-center">
            <div className="w-16 h-16 rounded-[var(--radius-full)] bg-[var(--color-error)]/10 flex items-center justify-center mb-[var(--space-md)]">
              <AlertCircle className="w-8 h-8 text-[var(--color-error)]" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--color-primary)] mb-2">加载失败</h2>
            <p className="text-sm text-[var(--color-secondary)] mb-[var(--space-lg)]">
              数据加载出错，请检查网络连接后重试
            </p>
            <button
              onClick={() => refetch()}
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

  if (!isLoading && projects.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-tertiary)]">
        <main className="max-w-6xl mx-auto px-[var(--space-md)] py-[var(--space-2xl)]">
          <div className="bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)] p-[var(--space-xl)] text-center">
            <div className="w-16 h-16 rounded-[var(--radius-full)] bg-[var(--color-bg-secondary)] flex items-center justify-center mb-[var(--space-md)] mx-auto">
              <FolderOpen className="w-8 h-8 text-[var(--color-secondary)]" />
            </div>
            <h1 className="text-xl font-semibold text-[var(--color-primary)] mb-2">暂无项目</h1>
            <p className="text-sm text-[var(--color-secondary)]">
              {activeTab === 'all'
                ? '还没有任何项目，敬请期待'
                : activeTab === 'enterprise'
                  ? '还没有企业项目，敬请期待'
                  : '还没有个人项目，敬请期待'}
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-tertiary)]">
      <main className="max-w-6xl mx-auto px-[var(--space-md)] py-[var(--space-2xl)]">
        {/* Header */}
        <div className="mb-[var(--space-xl)]">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-primary)] mb-2">
            项目展示
          </h1>
          <p className="text-sm text-[var(--color-secondary)] mb-[var(--space-lg)]">查看我的项目</p>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key)
                  setPage(1)
                }}
                className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-[var(--radius-md)] transition-colors duration-[var(--duration-base)] ease-standard
									${
                    activeTab === tab.key
                      ? 'bg-[var(--color-primary)] text-white shadow-[var(--shadow-card)]'
                      : 'bg-[var(--color-bg)] text-[var(--color-secondary)] border border-[var(--color-border-light)] hover:bg-[var(--color-bg-secondary)]'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[var(--space-lg)]">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <ProjectCardSkeleton key={i} />)
            : projects.map((project) => <ProjectCard key={project.id} project={project} />)}
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-[var(--space-xl)]">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="inline-flex items-center justify-center w-10 h-10 rounded-[var(--radius-md)] text-[var(--color-secondary)]
								disabled:opacity-50 disabled:cursor-not-allowed
								hover:bg-[var(--color-bg-secondary)] transition-colors duration-[var(--duration-base)] ease-standard"
            >
              ←
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`inline-flex items-center justify-center w-10 h-10 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-[var(--duration-base)] ease-standard
									${
                    page === pageNum
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'text-[var(--color-secondary)] hover:bg-[var(--color-bg-secondary)]'
                  }`}
              >
                {pageNum}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="inline-flex items-center justify-center w-10 h-10 rounded-[var(--radius-md)] text-[var(--color-secondary)]
								disabled:opacity-50 disabled:cursor-not-allowed
								hover:bg-[var(--color-bg-secondary)] transition-colors duration-[var(--duration-base)] ease-standard"
            >
              →
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

export default ProjectsPage
