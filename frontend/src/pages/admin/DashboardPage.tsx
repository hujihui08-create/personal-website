import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Briefcase, FolderOpen, FileText, Edit3, TrendingUp, Clock, Award } from 'lucide-react'
import { useProfile } from '@/hooks/useProfile'
import { useExperiences } from '@/hooks/useExperiences'
import { useResume } from '@/hooks/useResume'

const StatCard = ({
  icon: Icon, label, value, color, to, trend }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number | string
  color: string
  to?: string
  trend?: string
}) => {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)] p-[var(--space-lg)] hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--color-accent)]/30 transition-all duration-[var(--duration-base)]"
    >
      <div className="flex items-start justify-between mb-[var(--space-md)]">
        <div className={`p-3 rounded-[var(--radius-md)] ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-xs font-medium text-[var(--color-success)] bg-[var(--color-success)]/10 px-2 py-1 rounded-[var(--radius-sm)]">
            <TrendingUp className="w-3 h-3" />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-sm text-[var(--color-secondary)]">{label}</p>
        <p className="text-3xl font-bold text-[var(--color-primary)] group-hover:text-[var(--color-accent)] transition-colors">{value}</p>
      </div>
    </motion.div>
  )

  if (to) {
    return <Link to={to} className="block h-full">{content}</Link>
  }

  return content
}

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-[var(--color-bg-secondary)] rounded-[var(--radius-md)] ${className}`} />
)

const QuickAction = ({ 
  icon: Icon, 
  label, 
  to, 
  color 
}: { 
  icon: React.ComponentType<{ className?: string }>
  label: string
  to: string
  color: string
}) => (
  <Link
    to={to}
    className="group flex items-center gap-3 p-4 rounded-[var(--radius-lg)] border border-[var(--color-border-light)] bg-[var(--color-bg)] hover:shadow-md hover:border-[var(--color-accent)]/30 transition-all duration-[var(--duration-base)]"
  >
    <div className={`p-2.5 rounded-[var(--radius-md)] ${color} group-hover:scale-110 transition-transform duration-[var(--duration-base)]`}>
      <Icon className="w-5 h-5" />
    </div>
    <span className="text-sm font-medium text-[var(--color-primary)]">{label}</span>
  </Link>
)

export const DashboardPage = () => {
  const { data: profile, isLoading: profileLoading } = useProfile()
  const { data: experiences, isLoading: experiencesLoading } = useExperiences()
  const { data: resume, isLoading: resumeLoading } = useResume()

  const isLoading = profileLoading || experiencesLoading || resumeLoading

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <div className="space-y-[var(--space-xl)]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-primary)]">仪表盘</h1>
          <p className="text-[var(--color-secondary)] mt-1">欢迎回来，{profile?.name || '管理员'}！</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--color-secondary)] bg-[var(--color-bg)] px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border-light)]">
          <Clock className="w-4 h-4" />
          <span>{new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
        className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent)]/80 rounded-[var(--radius-xl)] p-[var(--space-xl)] text-[var(--color-bg)] shadow-lg"
      >
        {isLoading ? (
          <div className="flex items-center gap-[var(--space-lg)]">
            <Skeleton className="w-20 h-20 rounded-[var(--radius-full)]" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-[var(--space-lg)]">
            <div className="w-20 h-20 rounded-[var(--radius-full)] overflow-hidden bg-[var(--color-bg)]/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold text-[var(--color-bg)] border-2 border-[var(--color-bg)]/30">
              {profile?.name?.charAt(0) || '?'}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{profile?.name || '未设置'}</h2>
              <p className="text-[var(--color-bg)]/90 mt-1">{profile?.title || '未设置职位'}</p>
            </div>
            <Link
              to="/admin/profile"
              className="group flex items-center gap-2 h-11 px-[var(--space-lg)] bg-[var(--color-bg)] text-[var(--color-accent)] rounded-[var(--radius-md)] text-sm font-semibold hover:bg-[var(--color-bg)]/90 transition-all duration-[var(--duration-base)] shadow-md"
            >
              <Edit3 className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">编辑资料</span>
            </Link>
          </div>
        )}
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[var(--space-md)]"
      >
        {isLoading ? (
          <>
            <Skeleton className="h-40 rounded-[var(--radius-xl)]" />
            <Skeleton className="h-40 rounded-[var(--radius-xl)]" />
            <Skeleton className="h-40 rounded-[var(--radius-xl)]" />
          </>
        ) : (
          <>
            <StatCard
              icon={Briefcase}
              label="工作经历"
              value={experiences?.length || 0}
              color="bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
              to="/admin/experiences"
              trend="+2"
            />
            <StatCard
              icon={FolderOpen}
              label="作品项目"
              value="0"
              color="bg-[var(--color-success)]/10 text-[var(--color-success)]"
              to="/admin/projects"
            />
            <StatCard
              icon={FileText}
              label="简历状态"
              value={resume ? '已上传' : '未上传'}
              color={resume ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]' : 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]'}
              to="/admin/profile"
            />
          </>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
        className="space-y-[var(--space-md)]"
      >
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-[var(--color-accent)]" />
          <h3 className="text-lg font-semibold text-[var(--color-primary)]">快捷操作</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[var(--space-sm)]">
          <QuickAction
            icon={Edit3}
            label="编辑个人资料"
            to="/admin/profile"
            color="bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
          />
          <QuickAction
            icon={Briefcase}
            label="管理工作经历"
            to="/admin/experiences"
            color="bg-[var(--color-success)]/10 text-[var(--color-success)]"
          />
          <QuickAction
            icon={FolderOpen}
            label="管理作品项目"
            to="/admin/projects"
            color="bg-[var(--color-info)]/10 text-[var(--color-info)]"
          />
          <QuickAction
            icon={User}
            label="查看个人主页"
            to="/"
            color="bg-[var(--color-warning)]/10 text-[var(--color-warning)]"
          />
        </div>
      </motion.div>
    </div>
  )
}
