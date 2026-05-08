import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Save, Upload, X, Loader2, ChevronRight, FileText, Download, Trash2 } from 'lucide-react'
import { useProfile, useUpdateProfile, useUploadAvatar } from '@/hooks/useProfile'
import { useResume, useUploadResume, useDeleteResume } from '@/hooks/useResume'
import { toast } from 'sonner'

export const ProfileEditPage = () => {
  const { data: profile, isLoading: profileLoading } = useProfile()
  const { data: resume, isLoading: resumeLoading } = useResume()
  const updateProfileMutation = useUpdateProfile()
  const uploadAvatarMutation = useUploadAvatar()
  const uploadResumeMutation = useUploadResume()
  const deleteResumeMutation = useDeleteResume()
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const resumeInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [bio, setBio] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '')
      setTitle(profile.title ?? '')
      setBio(profile.bio ?? '')
      setGithubUrl(profile.github_url ?? '')
      setLinkedinUrl(profile.linkedin_url ?? '')
      setEmail(profile.email ?? '')
      setAvatarUrl(profile.avatar_url ?? '')
      setSkills(profile.skills ?? [])
    }
  }, [profile])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const result = await uploadAvatarMutation.mutateAsync(file)
      setAvatarUrl(result.data.avatar_url)
    } catch {
      toast.error('头像上传失败')
    }
  }

  const handleResumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      toast.error('请上传 PDF 格式的简历')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('文件大小不能超过 10MB')
      return
    }

    try {
      await uploadResumeMutation.mutateAsync(file)
      toast.success('简历已上传')
    } catch {
      toast.error('简历上传失败')
    }
  }

  const handleDeleteResume = async () => {
    try {
      await deleteResumeMutation.mutateAsync()
      setShowDeleteConfirm(false)
      toast.success('简历已删除')
    } catch {
      toast.error('删除失败')
    }
  }

  const handleAddSkill = () => {
    const trimmed = newSkill.trim()
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed])
      setNewSkill('')
    }
  }

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill))
  }

  const handleSkillKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddSkill()
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateProfileMutation.mutateAsync({
        name,
        title,
        bio,
        github_url: githubUrl,
        linkedin_url: linkedinUrl,
        email,
        avatar_url: avatarUrl,
        skills,
      })
      toast.success('个人资料已更新')
    } catch {
      // Error handled in mutation
    } finally {
      setIsSaving(false)
    }
  }

  const isLoading = profileLoading || resumeLoading

  if (isLoading) {
    return (
      <div className="space-y-[var(--space-xl)] animate-pulse">
        <div className="h-8 w-48 bg-[var(--color-bg-secondary)] rounded-[var(--radius-sm)]" />
        <div className="bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)] p-[var(--space-xl)] space-y-[var(--space-md)]">
          <div className="flex items-center gap-[var(--space-md)]">
            <div className="w-20 h-20 rounded-[var(--radius-full)] bg-[var(--color-bg-secondary)]" />
            <div className="h-10 w-28 bg-[var(--color-bg-secondary)] rounded-[var(--radius-sm)]" />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-16 bg-[var(--color-bg-secondary)] rounded-[var(--radius-sm)]" />
              <div className="h-10 w-full bg-[var(--color-bg-secondary)] rounded-[var(--radius-sm)]" />
            </div>
          ))}
        </div>
      </div>
    )
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
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-primary)]">个人资料</h1>
          <p className="text-[var(--color-secondary)] mt-1">管理您的个人信息和设置</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--color-secondary)] bg-[var(--color-bg)] px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border-light)]">
          <FileText className="w-4 h-4" />
          <span>公开简历页面</span>
        </div>
      </motion.div>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-[var(--color-secondary)]">
        <Link
          to="/admin/dashboard"
          className="hover:text-[var(--color-accent)] transition-colors"
        >
          仪表盘
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[var(--color-primary)] font-medium">个人资料</span>
      </nav>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          className="space-y-[var(--space-lg)]"
        >
          {/* Profile Form Card */}
          <div className="bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)] p-[var(--space-xl)] shadow-[var(--shadow-card-hover)] hover:shadow-md transition-shadow duration-[var(--duration-base)]">
            <div className="space-y-[var(--space-lg)]">
              {/* Avatar Section */}
              <div className="flex items-center gap-[var(--space-lg)]">
                <div className="w-20 h-20 rounded-[var(--radius-full)] overflow-hidden border-2 border-[var(--color-border-light)] flex-shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="当前头像"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[var(--color-accent-soft)] flex items-center justify-center">
                      <span className="text-2xl font-semibold text-[var(--color-accent)]">
                        {name?.charAt(0) ?? '?'}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadAvatarMutation.isPending}
                    className="inline-flex items-center gap-2 h-10 px-[var(--space-md)] border border-[var(--color-border-medium)] text-[var(--color-primary)] rounded-[var(--radius-md)] text-sm font-medium
                      hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] transition-all duration-[var(--duration-base)] ease-standard
                      focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2"
                  >
                    {uploadAvatarMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span>更换头像</span>
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    aria-label="选择头像文件"
                  />
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <label htmlFor="name" className="block text-sm font-medium text-[var(--color-primary)]">
                  姓名
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3 rounded-[var(--radius-md)] border border-[var(--color-border-medium)] bg-[var(--color-bg)] text-sm text-[var(--color-primary)]
                    placeholder:text-[var(--color-secondary)]
                    focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]
                    transition-all duration-[var(--duration-fast)]"
                  placeholder="请输入姓名"
                />
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label htmlFor="title" className="block text-sm font-medium text-[var(--color-primary)]">
                  职位
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-10 px-3 rounded-[var(--radius-md)] border border-[var(--color-border-medium)] bg-[var(--color-bg)] text-sm text-[var(--color-primary)]
                    placeholder:text-[var(--color-secondary)]
                    focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]
                    transition-all duration-[var(--duration-fast)]"
                  placeholder="请输入职位"
                />
              </div>

              {/* Bio */}
              <div className="space-y-1.5">
                <label htmlFor="bio" className="block text-sm font-medium text-[var(--color-primary)]">
                  简介
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border-medium)] bg-[var(--color-bg)] text-sm text-[var(--color-primary)]
                    placeholder:text-[var(--color-secondary)] resize-none
                    focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]
                    transition-all duration-[var(--duration-fast)]"
                  placeholder="请输入个人简介"
                />
              </div>

              {/* GitHub URL */}
              <div className="space-y-1.5">
                <label htmlFor="github" className="block text-sm font-medium text-[var(--color-primary)]">
                  GitHub 链接
                </label>
                <input
                  id="github"
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="w-full h-10 px-3 rounded-[var(--radius-md)] border border-[var(--color-border-medium)] bg-[var(--color-bg)] text-sm text-[var(--color-primary)]
                    placeholder:text-[var(--color-secondary)]
                    focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]
                    transition-all duration-[var(--duration-fast)]"
                  placeholder="https://github.com/username"
                />
              </div>

              {/* LinkedIn URL */}
              <div className="space-y-1.5">
                <label htmlFor="linkedin" className="block text-sm font-medium text-[var(--color-primary)]">
                  LinkedIn 链接
                </label>
                <input
                  id="linkedin"
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="w-full h-10 px-3 rounded-[var(--radius-md)] border border-[var(--color-border-medium)] bg-[var(--color-bg)] text-sm text-[var(--color-primary)]
                    placeholder:text-[var(--color-secondary)]
                    focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]
                    transition-all duration-[var(--duration-fast)]"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-[var(--color-primary)]">
                  邮箱
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 px-3 rounded-[var(--radius-md)] border border-[var(--color-border-medium)] bg-[var(--color-bg)] text-sm text-[var(--color-primary)]
                    placeholder:text-[var(--color-secondary)]
                    focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]
                    transition-all duration-[var(--duration-fast)]"
                  placeholder="email@example.com"
                />
              </div>

              {/* Skills */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[var(--color-primary)]">
                  技能标签
                </label>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-[var(--color-accent)] bg-[var(--color-accent-soft)] rounded-[var(--radius-full)]"
                    >
                      <span>{skill}</span>
                      <button
                        onClick={() => handleRemoveSkill(skill)}
                        className="w-4 h-4 flex items-center justify-center rounded-[var(--radius-full)] hover:bg-[var(--color-accent)]/20 transition-colors"
                        aria-label={`移除 ${skill}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={handleSkillKeyDown}
                    className="flex-1 h-10 px-3 rounded-[var(--radius-md)] border border-[var(--color-border-medium)] bg-[var(--color-bg)] text-sm text-[var(--color-primary)]
                      placeholder:text-[var(--color-secondary)]
                      focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]
                      transition-all duration-[var(--duration-fast)]"
                    placeholder="输入技能名称后按 Enter 添加"
                  />
                  <button
                    onClick={handleAddSkill}
                    disabled={!newSkill.trim()}
                    className="h-10 px-[var(--space-md)] border border-[var(--color-border-medium)] text-[var(--color-primary)] rounded-[var(--radius-md)] text-sm font-medium
                      hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] transition-all duration-[var(--duration-base)] ease-standard
                      focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    添加
                  </button>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-[var(--space-md)] border-t border-[var(--color-border-light)] flex items-center justify-between">
                <p className="text-xs text-[var(--color-secondary)]">
                  保存后，更改将立即在您的公开简历页面上显示
                </p>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 h-11 px-[var(--space-xl)] bg-[var(--color-accent)] text-[var(--color-bg)] rounded-[var(--radius-md)] text-sm font-semibold
                    hover:bg-[var(--color-accent)]/90 hover:shadow-md transition-all duration-[var(--duration-base)]
                    focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isSaving ? '保存中...' : '保存更改'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Resume Card */}
          <div className="bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)] p-[var(--space-xl)] shadow-[var(--shadow-card-hover)]">
            <h2 className="text-lg font-semibold text-[var(--color-primary)] mb-[var(--space-md)]">
              简历
            </h2>

            {resume ? (
              <div className="flex items-center justify-between p-4 bg-[var(--color-bg-secondary)] rounded-[var(--radius-md)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--color-accent-soft)] rounded-[var(--radius-md)] flex items-center justify-center">
                    <FileText className="w-5 h-5 text-[var(--color-accent)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-primary)]">{resume.file_name}</p>
                    <p className="text-xs text-[var(--color-secondary)]">已上传</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={resume.file_url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 h-9 px-3 border border-[var(--color-border-medium)] text-[var(--color-primary)] rounded-[var(--radius-md)] text-sm font-medium
                      hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] transition-all duration-[var(--duration-base)]"
                  >
                    <Download className="w-4 h-4" />
                    下载
                  </a>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={deleteResumeMutation.isPending}
                    className="inline-flex items-center gap-1 h-9 px-3 border border-[var(--color-error)]/30 text-[var(--color-error)] rounded-[var(--radius-md)] text-sm font-medium
                      hover:bg-[var(--color-error)]/10 transition-all duration-[var(--duration-base)]
                      disabled:opacity-50"
                  >
                    {deleteResumeMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    删除
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-[var(--color-border-light)] rounded-[var(--radius-md)] p-8 text-center">
                <FileText className="w-10 h-10 mx-auto mb-3 text-[var(--color-secondary)]" />
                <p className="text-sm text-[var(--color-secondary)] mb-3">暂无简历，上传 PDF 格式的简历</p>
                <button
                  onClick={() => resumeInputRef.current?.click()}
                  disabled={uploadResumeMutation.isPending}
                  className="inline-flex items-center gap-2 h-10 px-[var(--space-md)] border border-[var(--color-border-medium)] text-[var(--color-primary)] rounded-[var(--radius-md)] text-sm font-medium
                    hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] transition-all duration-[var(--duration-base)] ease-standard
                    focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2
                    disabled:opacity-50"
                >
                  {uploadResumeMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>上传简历</span>
                </button>
                <input
                  ref={resumeInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleResumeChange}
                  className="hidden"
                  aria-label="选择简历文件"
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-[var(--space-md)] bg-black/40"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-full max-w-sm bg-[var(--color-bg)] rounded-[var(--radius-xl)] shadow-[var(--shadow-card-strong)] p-[var(--space-xl)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-[var(--radius-full)] bg-[var(--color-error)]/10 flex items-center justify-center mb-[var(--space-md)]">
                  <Trash2 className="w-7 h-7 text-[var(--color-error)]" />
                </div>
                <h2 className="text-lg font-semibold text-[var(--color-primary)] mb-2">
                  确认删除
                </h2>
                <p className="text-sm text-[var(--color-secondary)] mb-[var(--space-lg)]">
                  确定要删除简历吗？此操作不可撤销。
                </p>
                <div className="flex items-center gap-[var(--space-sm)] w-full">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 h-10 border border-[var(--color-border-medium)] text-[var(--color-primary)] rounded-[var(--radius-md)] text-sm font-medium
                      hover:bg-[var(--color-bg-secondary)] transition-colors duration-[var(--duration-fast)]"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleDeleteResume}
                    disabled={deleteResumeMutation.isPending}
                    className="flex-1 h-10 bg-[var(--color-error)] text-[var(--color-bg)] rounded-[var(--radius-md)] text-sm font-medium
                      hover:opacity-90 transition-all duration-[var(--duration-fast)]
                      disabled:opacity-50 disabled:cursor-not-allowed
                      inline-flex items-center justify-center gap-2"
                  >
                    {deleteResumeMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>删除</span>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
  )
}

export default ProfileEditPage
