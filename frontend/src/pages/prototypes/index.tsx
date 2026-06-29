import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Eye,
  ExternalLink,
  FileArchive,
  Package,
  AlertCircle,
  RefreshCw,
  ChevronUp,
  Calendar,
} from 'lucide-react'
import { prototypeApi } from '@/api/prototypes'

const formatDate = (iso: string): string => {
  const date = new Date(iso)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

const Skeleton = ({ className }: { className?: string }) => (
  <div
    className={`animate-pulse bg-[var(--color-bg-secondary)] rounded-[var(--radius-xl)] ${className ?? ''}`}
  />
)

const PrototypeCardSkeleton = () => (
  <div className="space-y-4 p-[var(--space-lg)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)]">
    <div className="flex items-start justify-between">
      <div className="flex-1 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <Skeleton className="w-10 h-10 rounded-[var(--radius-md)]" />
    </div>
    <div className="flex items-center gap-3 pt-2">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-24" />
    </div>
  </div>
)

const PrototypePage = () => {
  const [activeId, setActiveId] = useState<number | null>(null)

  const {
    data: prototypes,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['prototypes-public'],
    queryFn: () => prototypeApi.list(),
    staleTime: 300000,
  })

  const togglePreview = (id: number) => {
    setActiveId((prev) => (prev === id ? null : id))
  }

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
              原型数据加载出错，请检查网络连接后重试
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

  if (!isLoading && (!prototypes || prototypes.length === 0)) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-tertiary)]">
        <main className="max-w-6xl mx-auto px-[var(--space-md)] py-[var(--space-2xl)]">
          {/* Header */}
          <div className="mb-[var(--space-xl)]">
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-primary)] mb-2">
              原型预览
            </h1>
            <p className="text-sm text-[var(--color-secondary)]">浏览前端原型 Demo</p>
          </div>

          <div className="bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)] p-[var(--space-xl)] text-center">
            <div className="w-16 h-16 rounded-[var(--radius-full)] bg-[var(--color-bg-secondary)] flex items-center justify-center mb-[var(--space-md)] mx-auto">
              <Package className="w-8 h-8 text-[var(--color-secondary)]" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--color-primary)] mb-2">暂无原型</h2>
            <p className="text-sm text-[var(--color-secondary)]">还没有上传任何原型，敬请期待</p>
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
            原型预览
          </h1>
          <p className="text-sm text-[var(--color-secondary)]">浏览前端原型 Demo</p>
        </div>

        {/* Prototype Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[var(--space-lg)]">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <PrototypeCardSkeleton key={i} />)
            : prototypes!.map((prototype) => (
                <div
                  key={prototype.id}
                  className={`bg-[var(--color-bg)] border rounded-[var(--radius-xl)] transition-all duration-[var(--duration-base)] ease-standard cursor-pointer
										${
                      activeId === prototype.id
                        ? 'border-[var(--color-accent)] shadow-[var(--shadow-card)]'
                        : 'border-[var(--color-border-light)] hover:border-[var(--color-accent)] hover:shadow-[var(--shadow-card)]'
                    }`}
                  onClick={() => togglePreview(prototype.id)}
                >
                  <div className="p-[var(--space-lg)]">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-[var(--color-primary)] mb-1 truncate">
                          {prototype.name}
                        </h3>
                        <p className="text-xs text-[var(--color-secondary)] flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(prototype.created_at)}
                        </p>
                      </div>
                      <div className="flex-shrink-0 ml-3">
                        <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)] flex items-center justify-center">
                          {activeId === prototype.id ? (
                            <ChevronUp className="w-5 h-5 text-[var(--color-accent)]" />
                          ) : (
                            <Eye className="w-5 h-5 text-[var(--color-secondary)]" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--color-border-light)]">
                      <div className="flex items-center gap-1.5 text-xs text-[var(--color-secondary)]">
                        <FileArchive className="w-3.5 h-3.5" />
                        <span>{prototype.file_count} 个文件</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(
                            `/api/prototypes/${prototype.id}/index.html`,
                            '_blank',
                            'noopener,noreferrer'
                          )
                        }}
                        className="inline-flex items-center gap-1 text-xs text-[var(--color-accent)] hover:text-[var(--color-primary)] transition-colors duration-[var(--duration-fast)]"
                        title="在新标签中全屏预览"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>全屏预览</span>
                      </button>
                    </div>
                  </div>

                  {/* Expanded preview area */}
                  {activeId === prototype.id && (
                    <div className="border-t border-[var(--color-border-light)]">
                      <div className="h-[80vh]">
                        <iframe
                          src={`/api/prototypes/${prototype.id}/index.html`}
                          sandbox="allow-scripts"
                          title={`原型预览 - ${prototype.name}`}
                          className="w-full h-full border-0"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
        </div>
      </main>
    </div>
  )
}

export default PrototypePage
