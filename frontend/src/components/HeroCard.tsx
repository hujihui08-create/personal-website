import { motion } from 'framer-motion'
import { Github, ExternalLink, Mail, Download, Eye, Calendar } from 'lucide-react'
import type { Profile } from '@/types'
import { useResume } from '@/hooks/useResume'

interface HeroCardProps {
  profile?: Profile
  isLoading?: boolean
}

interface SkeletonProps {
  className?: string
}

const Skeleton = ({ className }: SkeletonProps) => (
  <div
    className={`animate-pulse bg-[var(--color-bg-secondary)] rounded-[var(--radius-md)] ${className ?? ''}`}
  />
)

export const HeroCard = ({ profile, isLoading }: HeroCardProps) => {
  const { data: resume, isLoading: resumeLoading } = useResume()

  if (isLoading || resumeLoading) {
    return <HeroCardSkeleton />
  }

  if (!profile) {
    return null
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: false, amount: 0.3 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      className="bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)] p-[var(--space-md)] sm:p-[var(--space-xl)] shadow-[var(--shadow-card-hover)] hover:shadow-[var(--shadow-card-strong)] transition-all duration-[var(--duration-base)] ease-[var(--easing-standard)] hover:-translate-y-1"
    >
      <div className="flex flex-col items-center text-center">
        {/* Avatar */}
        <motion.div
          className="relative mb-[var(--space-lg)]"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 100 }}
        >
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[var(--radius-full)] overflow-hidden ring-4 ring-[#F5F5F5] shadow-[var(--shadow-card-strong)]">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={`${profile.name}的头像`}
                className="w-full h-full object-cover transition-transform duration-[var(--duration-slow)] ease-[var(--easing-standard)] hover:scale-110"
              />
            ) : (
              <div className="w-full h-full bg-[var(--color-accent)] flex items-center justify-center text-[var(--color-bg)] text-3xl font-semibold">
                {profile.name?.charAt(0) ?? '?'}
              </div>
            )}
          </div>
        </motion.div>

        {/* Name & Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-primary)] mb-1">
          {profile.name}
        </h1>
        <p className="text-base sm:text-lg text-[var(--color-secondary)] mb-[var(--space-md)]">
          {profile.title}
        </p>

        {/* Bio */}
        {profile.bio && (
          <p className="text-sm text-[var(--color-secondary)] max-w-lg mb-[var(--space-lg)] leading-relaxed">
            {profile.bio}
          </p>
        )}

        {/* Skills Tags */}
        {profile.skills && profile.skills.length > 0 && (
          <motion.div
            className="flex flex-wrap justify-center gap-2 mb-[var(--space-lg)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            {profile.skills.map((skill, index) => (
              <motion.span
                key={skill}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05, duration: 0.3 }}
                whileHover={{ scale: 1.05, y: -2 }}
                className="inline-flex items-center px-3 py-1 text-sm font-medium text-[var(--color-secondary)] bg-[var(--color-bg-secondary)] rounded-[var(--radius-full)] cursor-default
                  hover:bg-[#EEEEEE] transition-colors duration-[var(--duration-base)] ease-[var(--easing-standard)]"
              >
                {skill}
              </motion.span>
            ))}
          </motion.div>
        )}

        {/* Social Links */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-[var(--space-md)] mb-[var(--space-lg)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          {profile.githubUrl && (
            <motion.a
              href={profile.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-[var(--space-sm)] px-[var(--space-md)] py-[var(--space-sm)] rounded-[var(--radius-md)] text-[var(--color-secondary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] transition-all duration-[var(--duration-base)] ease-[var(--easing-standard)]"
            >
              <Github className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm truncate max-w-48">{profile.githubUrl}</span>
            </motion.a>
          )}
          {profile.linkedinUrl && (
            <motion.a
              href={profile.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.3 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-[var(--space-sm)] px-[var(--space-md)] py-[var(--space-sm)] rounded-[var(--radius-md)] text-[var(--color-secondary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] transition-all duration-[var(--duration-base)] ease-[var(--easing-standard)]"
            >
              <ExternalLink className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm truncate max-w-48">{profile.linkedinUrl}</span>
            </motion.a>
          )}
          {profile.email && (
            <motion.a
              href={`mailto:${profile.email}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.3 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-[var(--space-sm)] px-[var(--space-md)] py-[var(--space-sm)] rounded-[var(--radius-md)] text-[var(--color-secondary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] transition-all duration-[var(--duration-base)] ease-[var(--easing-standard)]"
            >
              <Mail className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm truncate max-w-48">{profile.email}</span>
            </motion.a>
          )}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-[var(--space-sm)]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          {resume && (
            <motion.a
              href={resume.file_url}
              download
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 h-11 px-[var(--space-md)] bg-[var(--color-primary)] text-[var(--color-bg)] rounded-[var(--radius-sm)] text-sm font-medium
                hover:bg-[var(--color-secondary)] transition-all duration-[var(--duration-base)] ease-[var(--easing-standard)]
                focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2"
            >
              <Download className="w-4 h-4" />
              <span>下载简历</span>
            </motion.a>
          )}
          <motion.a
            href="/projects"
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 h-11 px-[var(--space-md)] border border-[var(--color-border-medium)] text-[var(--color-primary)] rounded-[var(--radius-sm)] text-sm font-medium
              hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] transition-all duration-[var(--duration-base)] ease-[var(--easing-standard)]
              focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2"
          >
            <Eye className="w-4 h-4" />
            <span>查看作品</span>
          </motion.a>
          <motion.a
            href="/booking"
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 h-11 px-[var(--space-md)] border border-[var(--color-border-medium)] text-[var(--color-primary)] rounded-[var(--radius-sm)] text-sm font-medium
              hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] transition-all duration-[var(--duration-base)] ease-[var(--easing-standard)]
              focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2"
          >
            <Calendar className="w-4 h-4" />
            <span>预约面试</span>
          </motion.a>
        </motion.div>
      </div>
    </motion.section>
  )
}

const HeroCardSkeleton = () => (
  <div className="bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)] p-[var(--space-xl)] shadow-[var(--shadow-card-hover)]">
    <div className="flex flex-col items-center text-center">
      <div className="mb-[var(--space-lg)]">
        <Skeleton className="w-24 h-24 sm:w-28 sm:h-28 rounded-[var(--radius-full)] ring-4 ring-[#F5F5F5]" />
      </div>
      <Skeleton className="w-40 h-7 mb-2" />
      <Skeleton className="w-56 h-5 mb-[var(--space-md)]" />
      <Skeleton className="w-full max-w-lg h-16 mb-[var(--space-lg)]" />
      <div className="flex flex-wrap justify-center gap-2 mb-[var(--space-lg)]">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton
            key={i}
            className="w-16 h-7 rounded-[var(--radius-full)] bg-[var(--color-bg-secondary)]"
          />
        ))}
      </div>
      <div className="flex items-center gap-[var(--space-md)] mb-[var(--space-lg)]">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="w-11 h-11 rounded-[var(--radius-md)]" />
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-[var(--space-sm)]">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="w-28 h-11 rounded-[var(--radius-md)]" />
        ))}
      </div>
    </div>
  </div>
)
