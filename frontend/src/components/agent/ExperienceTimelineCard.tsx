import { Briefcase, GraduationCap } from 'lucide-react'
import type { ExperienceBrief } from '@/types'

interface ExperienceTimelineCardProps {
  experiences: ExperienceBrief[]
}

const typeConfig: Record<string, { label: string; icon: typeof Briefcase }> = {
  study: { label: '学习', icon: GraduationCap },
  internship: { label: '实习', icon: Briefcase },
  work: { label: '工作', icon: Briefcase },
}

const getTypeConfig = (t: string) => {
  return typeConfig[t] ?? typeConfig['work']
}

export const ExperienceTimelineCard = ({ experiences }: ExperienceTimelineCardProps) => {
  const sorted = [...experiences].sort((a, b) => b.sortOrder - a.sortOrder)

  return (
    <div className="mt-3 pt-3 border-t border-[var(--color-border-light)]">
      <div className="flex items-center gap-1.5 mb-2.5">
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-[var(--color-secondary)] flex-shrink-0"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span className="text-xs text-[var(--color-secondary)]">工作经历时间线</span>
      </div>

      <div className="relative pl-7">
        <div className="absolute left-[10px] top-2 bottom-2 w-px bg-[var(--color-border-light)]" />

        {sorted.map((exp) => {
          const config = getTypeConfig(exp.type)
          const Icon = config.icon
          const dateRange = exp.endDate
            ? `${exp.startDate} — ${exp.endDate}`
            : `${exp.startDate} — 至今`

          return (
            <div key={exp.id} className="relative mb-3.5 last:mb-0">
              <div
                className={`absolute left-[-28px] top-1 w-[22px] h-[22px] rounded-full bg-[var(--color-bg)] border-2 flex items-center justify-center z-[1]
                  ${exp.type === 'work' ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]' : ''}
                  ${exp.type === 'study' ? 'border-[var(--color-success)] bg-[var(--color-success-soft)]' : ''}
                  ${exp.type === 'internship' ? 'border-[var(--color-warning)] bg-[var(--color-warning-soft)]' : ''}`}
              >
                <Icon className="w-3 h-3 text-[var(--color-secondary)]" />
              </div>

              <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] rounded-[var(--radius-md)] p-2.5">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] text-[var(--color-secondary)] bg-[var(--color-bg)] px-1.5 py-0.5 rounded-[var(--radius-full)] whitespace-nowrap">
                    {dateRange}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-[var(--radius-full)] font-medium
                    ${exp.type === 'work' ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : ''}
                    ${exp.type === 'study' ? 'bg-[var(--color-success-soft)] text-[var(--color-success)]' : ''}
                    ${exp.type === 'internship' ? 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]' : ''}`}
                  >
                    {config.label}
                  </span>
                </div>
                <div className="text-[13px] font-semibold text-[var(--color-primary)] mb-0.5">
                  {exp.position}
                </div>
                <div className="text-[11px] text-[var(--color-accent)] mb-1.5">
                  {exp.companyName}
                </div>
                {exp.description && (
                  <p className="text-[11px] text-[var(--color-secondary)] leading-relaxed line-clamp-2">
                    {exp.description}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
