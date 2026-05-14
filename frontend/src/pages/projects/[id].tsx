import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Github,
  ExternalLink,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useProject } from '@/hooks/useProjects'

const Skeleton = ({ className }: { className?: string }) => (
  <div
    className={`animate-pulse bg-[var(--color-bg-secondary)] rounded-[var(--radius-md)] ${className ?? ''}`}
  />
)

export const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const projectId = id ? parseInt(id, 10) : undefined
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageLoaded, setImageLoaded] = useState(false)

  const { data: project, isLoading, isError, refetch } = useProject(projectId)

  const allImages = project ? [project.coverImage, ...(project.images ?? [])].filter(Boolean) : []

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const nextImage = () => {
    if (allImages.length === 0) return
    setImageLoaded(false)
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length)
  }

  const prevImage = () => {
    if (allImages.length === 0) return
    setImageLoaded(false)
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length)
  }

  const handleIndicatorClick = (index: number) => {
    if (index === currentImageIndex) return
    setImageLoaded(false)
    setCurrentImageIndex(index)
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-tertiary)]">
        <main className="max-w-4xl mx-auto px-[var(--space-md)] py-[var(--space-2xl)]">
          <div className="flex flex-col items-center justify-center py-[var(--space-3xl)] text-center">
            <div className="w-16 h-16 rounded-[var(--radius-full)] bg-[var(--color-error)]/10 flex items-center justify-center mb-[var(--space-md)]">
              <AlertCircle className="w-8 h-8 text-[var(--color-error)]" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--color-primary)] mb-2">加载失败</h2>
            <p className="text-sm text-[var(--color-secondary)] mb-[var(--space-lg)]">
              作品加载出错，请检查网络连接后重试
            </p>
            <div className="flex gap-2">
              <Link
                to="/projects"
                className="inline-flex items-center gap-2 h-11 px-[var(--space-md)] border border-[var(--color-border-medium)] text-[var(--color-primary)] rounded-[var(--radius-sm)] text-sm font-medium
									hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] transition-all duration-[var(--duration-base)] ease-standard
									focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>返回作品列表</span>
              </Link>
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
          </div>
        </main>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-tertiary)]">
        <main className="max-w-4xl mx-auto px-[var(--space-md)] py-[var(--space-2xl)]">
          <div className="mb-[var(--space-lg)]">
            <Skeleton className="w-32 h-10" />
          </div>
          <Skeleton className="aspect-video w-full rounded-[var(--radius-xl)] mb-[var(--space-lg)]" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        </main>
      </div>
    )
  }

  if (!project) {
    return null
  }

  const dateRange =
    project.startDate && project.endDate
      ? `${formatDate(project.startDate)} - ${formatDate(project.endDate)}`
      : project.startDate
        ? formatDate(project.startDate)
        : ''

  return (
    <div className="min-h-screen bg-[var(--color-bg-tertiary)]">
      <main className="max-w-4xl mx-auto px-[var(--space-md)] py-[var(--space-2xl)]">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-[var(--space-lg)]"
        >
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 h-10 px-[var(--space-md)] text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors duration-[var(--duration-base)] ease-standard"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回作品列表</span>
          </Link>
        </motion.div>

        {/* Image Carousel */}
        {allImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative mb-[var(--space-xl)] rounded-[var(--radius-xl)] overflow-hidden bg-[var(--color-bg-secondary)] select-none"
            style={{ minHeight: '320px', maxHeight: '70vh' }}
          >
            <div
              className={`absolute inset-0 scale-110 transition-opacity duration-[var(--duration-slow)] ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              key={`bg-${currentImageIndex}`}
              style={{
                backgroundImage: `url(${allImages[currentImageIndex]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(30px)',
              }}
            />
            <div
              className="relative z-10 w-full h-full"
              style={{ maxHeight: '70vh' }}
              onTouchStart={(e) => {
                const startX = e.touches[0].clientX
                const container = e.currentTarget
                const handleTouchEnd = (ev: TouchEvent) => {
                  const endX = ev.changedTouches[0].clientX
                  const diff = startX - endX
                  if (Math.abs(diff) > 50) {
                    if (diff > 0) nextImage()
                    else prevImage()
                  }
                  container.removeEventListener('touchend', handleTouchEnd)
                }
                container.addEventListener('touchend', handleTouchEnd, { passive: true })
              }}
            >
              <motion.img
                key={currentImageIndex}
                src={allImages[currentImageIndex]}
                alt={project.name}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full object-contain"
                style={{ maxHeight: '70vh', margin: '0 auto' }}
                draggable={false}
              />
            </div>

            {/* Navigation Buttons */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-[var(--radius-full)] bg-black/50 text-white flex items-center justify-center
										hover:bg-black/70 transition-colors duration-[var(--duration-base)] ease-standard"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-[var(--radius-full)] bg-black/50 text-white flex items-center justify-center
										hover:bg-black/70 transition-colors duration-[var(--duration-base)] ease-standard"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                  {allImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleIndicatorClick(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-[var(--duration-base)] ease-standard
												${index === currentImageIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/80'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Header */}
          <div className="mb-[var(--space-xl)]">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-[var(--radius-sm)] ${
                  project.type === 'enterprise'
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-[var(--color-accent)] text-white'
                }`}
              >
                {project.type === 'enterprise' ? '企业项目' : '个人项目'}
              </span>
              {dateRange && (
                <span className="inline-flex items-center gap-1 text-xs text-[var(--color-secondary)]">
                  <Calendar className="w-3 h-3 flex-shrink-0" />
                  {dateRange}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-primary)] mb-3">
              {project.name}
            </h1>

            {project.summary && (
              <p className="text-lg text-[var(--color-secondary)] mb-6">{project.summary}</p>
            )}

            {/* Tags */}
            {project.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 text-sm font-medium text-[var(--color-secondary)] bg-[var(--color-bg-secondary)] rounded-[var(--radius-full)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 h-11 px-[var(--space-md)] border border-[var(--color-border-medium)] text-[var(--color-primary)] rounded-[var(--radius-sm)] text-sm font-medium
										hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] transition-all duration-[var(--duration-base)] ease-standard
										focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2"
                >
                  <Github className="w-4 h-4" />
                  <span>查看源码</span>
                </a>
              )}
              {project.demoUrl && (
                <a
                  href={project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 h-11 px-[var(--space-md)] bg-[var(--color-accent)] text-white rounded-[var(--radius-sm)] text-sm font-medium
										hover:bg-[var(--color-accent)]/90 transition-all duration-[var(--duration-base)] ease-standard
										focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>在线演示</span>
                </a>
              )}
            </div>
          </div>

          {/* Description */}
          {project.description && (
            <div className="bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)] p-[var(--space-lg)]">
              <h2 className="text-lg font-semibold text-[var(--color-primary)] mb-4">项目详情</h2>
              <div className="prose prose-gray max-w-none">
                {/* Markdown content will be rendered here */}
                <div className="text-[var(--color-secondary)] whitespace-pre-wrap">
                  {project.description}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}

export default ProjectDetailPage
