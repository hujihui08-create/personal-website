import { Link } from 'react-router-dom'
import type { ProjectBrief } from '@/types'

interface ProjectListCardProps {
  projects: ProjectBrief[]
}

const gradientColors = [
  'from-[#667eea] to-[#764ba2]',
  'from-[#f093fb] to-[#f5576c]',
  'from-[#4facfe] to-[#00f2fe]',
  'from-[#43e97b] to-[#38f9d7]',
  'from-[#fa709a] to-[#fee140]',
  'from-[#a18cd1] to-[#fbc2eb]',
]

export const ProjectListCard = ({ projects }: ProjectListCardProps) => {
  return (
    <div className="mt-3 pt-3 border-t border-[var(--color-border-light)]">
      <div className="text-xs text-[var(--color-secondary)] mb-2.5">项目列表（点击查看详情）</div>

      <div className="grid grid-cols-2 gap-2.5">
        {projects.map((project, index) => {
          const gradient = gradientColors[index % gradientColors.length]
          const initials = project.name.slice(0, 2)

          return (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="block bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] rounded-[var(--radius-md)] overflow-hidden
                hover:border-[var(--color-accent)] hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5
                transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)]"
            >
              {project.coverImage ? (
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={project.coverImage}
                    alt={project.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div
                  className={`aspect-[16/10] bg-gradient-to-br ${gradient} flex items-center justify-center`}
                >
                  <span className="text-white text-lg font-bold">{initials}</span>
                </div>
              )}

              <div className="p-2.5">
                <div className="text-[12px] font-semibold text-[var(--color-primary)] mb-1">
                  {project.name}
                </div>
                <p className="text-[10px] text-[var(--color-secondary)] leading-relaxed line-clamp-2 mb-2">
                  {project.summary}
                </p>

                {project.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {project.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] px-1.5 py-0.5 rounded-[var(--radius-full)] bg-[var(--color-bg)] text-[var(--color-secondary)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="text-[10px] text-[var(--color-accent)] mt-1.5 font-medium">
                  查看详情 &rarr;
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
