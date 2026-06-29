import { memo, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, Github, ExternalLink, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Project } from '@/types'
import { normalizeUrl } from '@/lib/utils'

interface ProjectCardProps {
  project: Project
}

export const ProjectCard = memo(({ project }: ProjectCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short' })
  }

  const dateRange = useMemo(() => {
    return project.startDate && project.endDate
      ? `${formatDate(project.startDate)} - ${formatDate(project.endDate)}`
      : project.startDate
        ? formatDate(project.startDate)
        : ''
  }, [project.startDate, project.endDate])

  return (
    <Link to={`/projects/${project.id}`} className="block">
      <motion.article
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        whileHover={{ y: -4 }}
        className="group relative bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)] overflow-hidden shadow-[var(--shadow-card-hover)] hover:shadow-[var(--shadow-card-strong)] transition-all duration-[var(--duration-base)] ease-[var(--easing-standard)]"
      >
        {/* Cover Image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-[var(--color-bg-secondary)]">
          {project.coverImage && !imageError ? (
            <>
              <div
                className={`absolute inset-0 scale-110 transition-opacity duration-[var(--duration-slow)] ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                  backgroundImage: `url(${project.coverImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(20px)',
                }}
              />
              <img
                src={project.coverImage}
                alt={project.name}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                className={`relative z-10 w-full h-full object-contain transition-all duration-[var(--duration-slow)] ease-[var(--easing-standard)] group-hover:scale-110 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--color-secondary)]">
              <Eye className="w-12 h-12 opacity-50" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-[var(--space-md)]">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-[var(--color-primary)] line-clamp-1">
              {project.name}
            </h3>
            <span
              className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-[var(--radius-sm)] flex-shrink-0 ${
                project.type === 'enterprise'
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-accent)] text-white'
              }`}
            >
              {project.type === 'enterprise' ? '企业项目' : '个人项目'}
            </span>
          </div>

          {dateRange && (
            <div className="flex items-center gap-1 text-xs text-[var(--color-secondary)] mb-2">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span>{dateRange}</span>
            </div>
          )}

          {project.summary && (
            <p className="text-sm text-[var(--color-secondary)] mb-3 line-clamp-2 leading-relaxed">
              {project.summary}
            </p>
          )}

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {project.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-[var(--color-secondary)] bg-[var(--color-bg-secondary)] rounded-[var(--radius-sm)]"
                >
                  {tag}
                </span>
              ))}
              {project.tags.length > 3 && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-[var(--color-secondary)]">
                  +{project.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Links */}
          <div className="flex items-center gap-2">
            {project.githubUrl && (
              <a
                href={normalizeUrl(project.githubUrl)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] text-[var(--color-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-bg-secondary)] transition-all duration-[var(--duration-base)] ease-[var(--easing-standard)]"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
            )}
            {project.demoUrl && (
              <a
                href={normalizeUrl(project.demoUrl)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] text-[var(--color-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-bg-secondary)] transition-all duration-[var(--duration-base)] ease-[var(--easing-standard)]"
                aria-label="Demo"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </motion.article>
    </Link>
  )
})

ProjectCard.displayName = 'ProjectCard'
