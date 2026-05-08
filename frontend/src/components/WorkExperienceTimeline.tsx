import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronDown, ChevronUp, ExternalLink, Briefcase, GraduationCap, Award } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { WorkExperience } from '@/types'

interface WorkExperienceTimelineProps {
  experiences?: WorkExperience[]
  isLoading?: boolean
}

const Skeleton = ({ className }: { className?: string }) => (
  <div
    className={`animate-pulse bg-[var(--color-bg-secondary)] rounded-[var(--radius-md)] ${className ?? ''}`}
  />
)

const typeConfig = {
  work: {
    label: '工作',
    icon: Briefcase,
    textColor: 'text-[var(--color-accent)]',
    bgColor: 'bg-[var(--color-accent-soft)]',
  },
  education: {
    label: '教育',
    icon: GraduationCap,
    textColor: 'text-[var(--color-success)]',
    bgColor: 'bg-[rgba(16,185,129,0.10)]',
  },
  achievement: {
    label: '成就',
    icon: Award,
    textColor: 'text-[var(--color-warning)]',
    bgColor: 'bg-[rgba(245,158,11,0.10)]',
  },
}

const ExperienceCard = ({ experience }: { experience: WorkExperience }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const type = experience.type || 'work'
  const config = typeConfig[type]
  const Icon = config.icon

  const dateRange = `${formatDate(new Date(experience.start_date))} — ${
    experience.end_date ? formatDate(new Date(experience.end_date)) : '至今'
  }`

  return (
    <motion.li
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.2 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="relative pl-12 sm:pl-16 mb-[var(--space-lg)] last:mb-0"
      aria-label={`${experience.company_name} - ${experience.position}`}
    >
      {/* Timeline Node (Icon Badge) */}
      <motion.div
        className="absolute left-0 top-0 w-9 h-9 sm:w-10 sm:h-10 rounded-[var(--radius-full)] bg-[var(--color-bg)] border border-[var(--color-border-light)] shadow-sm flex items-center justify-center z-[1]"
        aria-label={`${config.label}经历节点`}
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: false }}
        transition={{ delay: 0.2, duration: 0.3, type: 'spring', stiffness: 200 }}
      >
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-accent)]" />
      </motion.div>

      {/* Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
          whileHover={{ y: -4, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' }}
          whileFocus={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', borderColor: '#0066FF' }}
          tabIndex={0}
          className="bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)] p-[var(--space-md)] sm:p-[var(--space-lg)]
              transition-all duration-[var(--duration-base)] ease-standard
              hover:shadow-[var(--shadow-card-hover)] focus:border-[var(--color-accent)] focus:shadow-[var(--shadow-card-hover)] outline-none cursor-pointer"
        >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Type Chip */}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-[var(--radius-full)] ${config.textColor} ${config.bgColor}`}>
              <Icon className="w-3 h-3" />
              {config.label}
            </span>
            {/* Time Chip */}
            <time className="text-xs text-[var(--color-secondary)] whitespace-nowrap">
              {dateRange}
            </time>
          </div>
        </div>

        {/* Position & Company */}
        <h3 className="text-base sm:text-lg font-semibold text-[var(--color-primary)] mb-1">
          {experience.position}
        </h3>
        <p className="text-sm font-medium text-[var(--color-accent)] mb-3">
          {experience.company_name}
        </p>

        {/* Description - collapsed preview */}
        {experience.description && (
          <>
            <p className={`text-sm text-[var(--color-secondary)] leading-relaxed ${!isExpanded ? 'line-clamp-2' : ''}`}>
              {experience.description}
            </p>

            {/* Expand/Collapse Button */}
            {experience.description.length > 100 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-[var(--color-accent)] hover:text-[var(--color-accent)]/80 transition-colors duration-[var(--duration-fast)]"
                aria-expanded={isExpanded}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>收起详情</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>展开查看详情</span>
                  </>
                )}
              </button>
            )}
          </>
        )}

        {/* Related Projects */}
        {experience.projects && experience.projects.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[var(--color-border-light)]">
            <span className="text-xs text-[var(--color-secondary)]">关联项目：</span>
            {experience.projects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[var(--color-accent)] bg-[var(--color-accent-soft)] rounded-[var(--radius-full)]
                  hover:bg-[var(--color-accent)] hover:text-[var(--color-bg)] transition-all duration-[var(--duration-fast)]"
              >
                <span>{project.title}</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    </motion.li>
  )
}

export const WorkExperienceTimeline = ({ experiences, isLoading }: WorkExperienceTimelineProps) => {
  if (isLoading) {
    return <TimelineSkeleton />
  }

  if (!experiences || experiences.length === 0) {
    return null
  }

  const sortedExperiences = [...experiences].sort(
    (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  )

  return (
    <section className="bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)] p-[var(--space-xl)] shadow-[var(--shadow-card-hover)]">
      <h2 className="text-xl font-bold text-[var(--color-primary)] mb-[var(--space-lg)]">
        工作经历
      </h2>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical Connection Line - 1px width */}
        <div className="absolute left-[19px] sm:left-[23px] top-2 bottom-2 w-[1px] bg-[var(--color-border-light)]" aria-hidden="true" />

        <ol className="space-y-0">
          {sortedExperiences.map((experience) => (
            <ExperienceCard key={experience.id} experience={experience} />
          ))}
        </ol>
      </div>
    </section>
  )
}

const TimelineSkeleton = () => (
  <div className="bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)] p-[var(--space-xl)] shadow-[var(--shadow-card-hover)]">
    <Skeleton className="w-24 h-7 mb-[var(--space-lg)]" />
    <div className="relative">
      <div className="absolute left-[19px] sm:left-[23px] top-2 bottom-2 w-[1px] bg-[var(--color-border-light)]" />
      <div className="space-y-[var(--space-lg)]">
        {[1, 2, 3].map((i) => (
          <div key={i} className="relative pl-12 sm:pl-16">
            <div className="absolute left-0 top-0 w-9 h-9 sm:w-10 sm:h-10 rounded-[var(--radius-full)] bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)]" />
            <div className="bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)] p-[var(--space-md)] sm:p-[var(--space-lg)]">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="w-16 h-5 rounded-full" />
                <Skeleton className="w-24 h-4" />
              </div>
              <Skeleton className="w-3/4 h-5 mb-2" />
              <Skeleton className="w-32 h-4 mb-3" />
              <Skeleton className="w-full h-4 mb-1" />
              <Skeleton className="w-3/4 h-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)
