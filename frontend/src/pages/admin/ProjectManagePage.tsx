import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
	Plus,
	Edit3,
	Trash2,
	X,
	Loader2,
	ChevronRight,
	FolderOpen,
	Globe,
	Github,
	Image,
	Upload,
} from 'lucide-react'
import {
	useProjects,
	useCreateProject,
	useUpdateProject,
	useDeleteProject,
} from '@/hooks/useProjects'
import { toast } from 'sonner'
import type { Project } from '@/types'
import { projectApi } from '@/api/projects'

interface ProjectFormData {
	name: string
 type: 'enterprise' | 'personal'
	startDate: string
	endDate: string
	summary: string
	description: string
	coverImage: string
	images: string
	githubUrl: string
	demoUrl: string
	tags: string
	sortOrder: number
}

const emptyFormData: ProjectFormData = {
	name: '',
	type: 'enterprise',
	startDate: '',
	endDate: '',
	summary: '',
	description: '',
	coverImage: '',
	images: '',
	githubUrl: '',
	demoUrl: '',
	tags: '',
	sortOrder: 0,
}

export const ProjectManagePage = () => {
	const { data: projectsData, isLoading } = useProjects({ page: 1, pageSize: 100 })
	const createMutation = useCreateProject()
	const updateMutation = useUpdateProject()
	const deleteMutation = useDeleteProject()

	const projects = projectsData?.items || []

	const [isModalOpen, setIsModalOpen] = useState(false)
	const [editingProject, setEditingProject] = useState<Project | null>(null)
	const [formData, setFormData] = useState<ProjectFormData>(emptyFormData)
	const [isSaving, setIsSaving] = useState(false)
	const [isUploading, setIsUploading] = useState(false)

	const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)

	useEffect(() => {
		if (editingProject) {
			setFormData({
				name: editingProject.name,
				type: editingProject.type,
				startDate: editingProject.startDate || '',
				endDate: editingProject.endDate || '',
				summary: editingProject.summary,
				description: editingProject.description,
				coverImage: editingProject.coverImage,
				images: (editingProject.images || []).join('\n'),
				githubUrl: editingProject.githubUrl,
				demoUrl: editingProject.demoUrl,
				tags: (editingProject.tags || []).join(','),
				sortOrder: editingProject.sortOrder,
			})
		} else {
			setFormData(emptyFormData)
		}
	}, [editingProject])

	const handleOpenAdd = () => {
		setEditingProject(null)
		setFormData(emptyFormData)
		setIsModalOpen(true)
	}

	const handleOpenEdit = (project: Project) => {
		setEditingProject(project)
		setIsModalOpen(true)
	}

	const handleCloseModal = () => {
		setIsModalOpen(false)
		setEditingProject(null)
	}

	const handleFormChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
	) => {
		const { name, value } = e.target
		setFormData((prev) => ({ ...prev, [name]: value }))
	}

	const handleSave = async () => {
		if (!formData.name.trim()) {
			toast.error('请填写项目名称')
			return
		}

		setIsSaving(true)
		try {
			const tagsArray = formData.tags
				? formData.tags
						.split(',')
						.map((t) => t.trim())
						.filter((t) => t)
				: []
			const imagesArray = formData.images
				? formData.images
						.split('\n')
						.map((t) => t.trim())
						.filter((t) => t)
				: []

			const payload = {
				name: formData.name,
				type: formData.type,
				startDate: formData.startDate || undefined,
				endDate: formData.endDate || undefined,
				summary: formData.summary,
				description: formData.description,
				coverImage: formData.coverImage,
				images: imagesArray,
				githubUrl: formData.githubUrl,
				demoUrl: formData.demoUrl,
				tags: tagsArray,
				sortOrder: formData.sortOrder,
			}

			if (editingProject) {
				await updateMutation.mutateAsync({ id: editingProject.id, data: payload })
			} else {
				await createMutation.mutateAsync(payload)
			}
			handleCloseModal()
		} catch (error) {
			console.error('操作失败', error)
		} finally {
			setIsSaving(false)
		}
	}

	const handleDelete = async () => {
		if (!deleteTarget) return
		try {
			await deleteMutation.mutateAsync(deleteTarget.id)
			setDeleteTarget(null)
		} catch (error) {
			console.error('删除失败', error)
		}
	}

	const handleUploadCoverImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		setIsUploading(true)
		try {
			const imageURL = await projectApi.uploadCoverImage(file)
			setFormData((prev) => ({ ...prev, coverImage: imageURL }))
			toast.success('封面图片上传成功')
		} catch (error) {
			console.error('上传失败', error)
			toast.error('封面图片上传失败')
		} finally {
			setIsUploading(false)
		}
	}

	const handleUploadProjectImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		setIsUploading(true)
		try {
			const imageURL = await projectApi.uploadProjectImage(file)
			setFormData((prev) => ({
				...prev,
				images: prev.images ? prev.images + '\n' + imageURL : imageURL,
			}))
			toast.success('项目图片上传成功')
		} catch (error) {
			console.error('上传失败', error)
			toast.error('项目图片上传失败')
		} finally {
			setIsUploading(false)
		}
	}

	const sortedProjects = [...projects].sort((a, b) => b.sortOrder - a.sortOrder)

	return (
		<div className="space-y-[var(--space-xl)]">
			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, ease: 'easeOut' }}
				className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
			>
				<div>
					<h1 className="text-2xl md:text-3xl font-bold text-[var(--color-primary)]">作品管理</h1>
					<p className="text-[var(--color-secondary)] mt-1">管理和编辑您的作品集项目</p>
				</div>
				<button
					onClick={handleOpenAdd}
					className="inline-flex items-center gap-2 h-11 px-[var(--space-lg)] bg-[var(--color-accent)] text-[var(--color-bg)] rounded-[var(--radius-md)] text-sm font-semibold
            hover:bg-[var(--color-accent)]/90 hover:shadow-md transition-all duration-[var(--duration-base)]
            focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2"
				>
					<Plus className="w-4 h-4" />
					<span>添加作品</span>
				</button>
			</motion.div>

			<nav className="flex items-center gap-1 text-sm text-[var(--color-secondary)]">
				<Link to="/admin/dashboard" className="hover:text-[var(--color-accent)] transition-colors">
					仪表盘
				</Link>
				<ChevronRight className="w-3.5 h-3.5" />
				<span className="text-[var(--color-primary)] font-medium">作品管理</span>
			</nav>

			{isLoading && (
				<div className="space-y-[var(--space-md)]">
					{[1, 2, 3].map((i) => (
						<div
							key={i}
							className="bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-lg)] p-[var(--space-md)] animate-pulse"
						>
							<div className="h-5 w-48 bg-[var(--color-bg-secondary)] rounded-[var(--radius-sm)] mb-2" />
							<div className="h-4 w-32 bg-[var(--color-bg-secondary)] rounded-[var(--radius-sm)] mb-2" />
							<div className="h-4 w-64 bg-[var(--color-bg-secondary)] rounded-[var(--radius-sm)]" />
						</div>
					))}
				</div>
			)}

			{!isLoading && sortedProjects.length === 0 && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, ease: 'easeOut' }}
					className="flex flex-col items-center justify-center py-[var(--space-3xl)] text-center bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)] hover:shadow-md transition-shadow duration-[var(--duration-base)]"
				>
					<div className="w-20 h-20 rounded-[var(--radius-full)] bg-[var(--color-accent-soft)] flex items-center justify-center mb-[var(--space-lg)]">
						<FolderOpen className="w-10 h-10 text-[var(--color-accent)]" />
					</div>
					<h2 className="text-xl font-semibold text-[var(--color-primary)] mb-2">
						暂无作品
					</h2>
					<p className="text-sm text-[var(--color-secondary)] mb-[var(--space-lg)] max-w-sm">
						开始添加您的第一个作品，展示您的项目经验和技能
					</p>
					<button
						onClick={handleOpenAdd}
						className="inline-flex items-center gap-2 h-11 px-[var(--space-lg)] bg-[var(--color-accent)] text-[var(--color-bg)] rounded-[var(--radius-md)] text-sm font-semibold
                hover:bg-[var(--color-accent)]/90 hover:shadow-md transition-all duration-[var(--duration-base)]"
					>
						<Plus className="w-4 h-4" />
						<span>添加第一个作品</span>
					</button>
				</motion.div>
			)}

			{!isLoading && sortedProjects.length > 0 && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.3 }}
					className="space-y-[var(--space-md)]"
				>
					{sortedProjects.map((project, index) => (
						<motion.div
							key={project.id}
							layout
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3, delay: index * 0.05 }}
							className="group bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-lg)] p-[var(--space-lg)]
                hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--color-accent)]/30 transition-all duration-[var(--duration-base)]"
						>
							<div className="flex items-start justify-between gap-[var(--space-md)]">
								<div className="flex-1 min-w-0">
									<div className="flex items-start justify-between gap-[var(--space-md)] mb-2">
										<div>
											<div className="flex items-center gap-2 mb-1">
												<h3 className="text-lg font-semibold text-[var(--color-primary)]">
													{project.name}
												</h3>
												<span
													className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-[var(--radius-sm)] ${
														project.type === 'enterprise'
															? 'bg-[var(--color-primary)] text-white'
															: 'bg-[var(--color-accent)] text-white'
													}`}
												>
													{project.type === 'enterprise' ? '企业项目' : '个人项目'}
												</span>
											</div>
											{project.summary && (
												<p className="text-sm text-[var(--color-secondary)] line-clamp-2">
													{project.summary}
												</p>
											)}
										</div>
									</div>

									{(project.tags && project.tags.length > 0) && (
										<div className="flex flex-wrap items-center gap-1.5 mt-3">
											{project.tags.map((tag) => (
												<span
													key={tag}
													className="inline-flex items-center px-2 py-1 text-xs font-medium text-[var(--color-accent)] bg-[var(--color-accent-soft)] rounded-[var(--radius-full)]"
												>
													{tag}
												</span>
											))}
										</div>
									)}

									<div className="flex flex-wrap items-center gap-3 mt-3">
										{project.coverImage && (
											<div className="flex items-center gap-1.5 text-xs text-[var(--color-secondary)]">
												<Image className="w-3.5 h-3.5" />
												<span>有封面图</span>
											</div>
										)}
										{project.githubUrl && (
											<a
												href={project.githubUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="flex items-center gap-1.5 text-xs text-[var(--color-secondary)] hover:text-[var(--color-accent)] transition-colors"
											>
												<Github className="w-3.5 h-3.5" />
												<span>GitHub</span>
											</a>
										)}
										{project.demoUrl && (
											<a
												href={project.demoUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="flex items-center gap-1.5 text-xs text-[var(--color-secondary)] hover:text-[var(--color-accent)] transition-colors"
											>
												<Globe className="w-3.5 h-3.5" />
												<span>Demo</span>
											</a>
										)}
									</div>
								</div>

								<div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-[var(--duration-fast)]">
									<button
										onClick={() => handleOpenEdit(project)}
										className="w-9 h-9 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-secondary)]
                    hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] transition-all duration-[var(--duration-fast)] hover:scale-110"
										aria-label={`编辑 ${project.name}`}
									>
										<Edit3 className="w-4 h-4" />
									</button>
									<button
										onClick={() => setDeleteTarget(project)}
										className="w-9 h-9 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-secondary)]
                    hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-all duration-[var(--duration-fast)] hover:scale-110"
										aria-label={`删除 ${project.name}`}
									>
										<Trash2 className="w-4 h-4" />
									</button>
								</div>

								<div className="flex items-center gap-2 flex-shrink-0 sm:hidden">
									<button
										onClick={() => handleOpenEdit(project)}
										className="w-10 h-10 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-secondary)]
                    hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] transition-all duration-[var(--duration-fast)]"
										aria-label={`编辑 ${project.name}`}
									>
										<Edit3 className="w-4 h-4" />
									</button>
									<button
										onClick={() => setDeleteTarget(project)}
										className="w-10 h-10 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-secondary)]
                    hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-all duration-[var(--duration-fast)]"
										aria-label={`删除 ${project.name}`}
									>
										<Trash2 className="w-4 h-4" />
									</button>
								</div>
							</div>
						</motion.div>
					))}
				</motion.div>
			)}

			<AnimatePresence>
				{isModalOpen && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-[var(--space-md)] bg-black/40 overflow-y-auto"
						onClick={handleCloseModal}
					>
						<motion.div
							initial={{ opacity: 0, scale: 0.95, y: 10 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 10 }}
							transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
							className="w-full max-w-2xl bg-[var(--color-bg)] rounded-[var(--radius-xl)] shadow-[var(--shadow-card-strong)] overflow-hidden my-8"
							onClick={(e) => e.stopPropagation()}
						>
							<div className="flex items-center justify-between px-[var(--space-lg)] pt-[var(--space-lg)] pb-[var(--space-md)] border-b border-[var(--color-border-light)]">
								<h2 className="text-lg font-semibold text-[var(--color-primary)]">
									{editingProject ? '编辑作品' : '添加作品'}
								</h2>
								<button
									onClick={handleCloseModal}
									className="w-9 h-9 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-secondary)]
                      hover:text-[var(--color-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
									aria-label="关闭"
								>
									<X className="w-4 h-4" />
								</button>
							</div>

							<div className="px-[var(--space-lg)] py-[var(--space-md)] space-y-[var(--space-md)] max-h-[70vh] overflow-y-auto">
								<div className="space-y-1.5">
									<label htmlFor="name" className="block text-sm font-medium text-[var(--color-primary)]">
										项目名称 <span className="text-[var(--color-error)]">*</span>
									</label>
									<input
										id="name"
										name="name"
										type="text"
										value={formData.name}
										onChange={handleFormChange}
										className="w-full h-10 px-3 rounded-[var(--radius-sm)] border border-[var(--color-border-medium)] bg-[var(--color-bg)] text-sm text-[var(--color-primary)]
                    placeholder:text-[var(--color-secondary)]
                    focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
										placeholder="请输入项目名称"
									/>
								</div>

								<div className="space-y-1.5">
									<label htmlFor="type" className="block text-sm font-medium text-[var(--color-primary)]">
										项目类型 <span className="text-[var(--color-error)]">*</span>
									</label>
									<select
										id="type"
										name="type"
										value={formData.type}
										onChange={handleFormChange}
										className="w-full h-10 px-3 rounded-[var(--radius-sm)] border border-[var(--color-border-medium)] bg-[var(--color-bg)] text-sm text-[var(--color-primary)]
                    focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
									>
										<option value="enterprise">企业项目</option>
										<option value="personal">个人项目</option>
									</select>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--space-md)]">
									<div className="space-y-1.5">
										<label htmlFor="startDate" className="block text-sm font-medium text-[var(--color-primary)]">
											开始日期
										</label>
										<input
											id="startDate"
											name="startDate"
											type="date"
											value={formData.startDate}
											onChange={handleFormChange}
											className="w-full h-10 px-3 rounded-[var(--radius-sm)] border border-[var(--color-border-medium)] bg-[var(--color-bg)] text-sm text-[var(--color-primary)]
                    focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
										/>
									</div>
									<div className="space-y-1.5">
										<label htmlFor="endDate" className="block text-sm font-medium text-[var(--color-primary)]">
											结束日期
										</label>
										<input
											id="endDate"
											name="endDate"
											type="date"
											value={formData.endDate}
											onChange={handleFormChange}
											className="w-full h-10 px-3 rounded-[var(--radius-sm)] border border-[var(--color-border-medium)] bg-[var(--color-bg)] text-sm text-[var(--color-primary)]
                    focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
										/>
									</div>
								</div>

								<div className="space-y-1.5">
									<label htmlFor="summary" className="block text-sm font-medium text-[var(--color-primary)]">
										项目简介
									</label>
									<input
										id="summary"
										name="summary"
										type="text"
										value={formData.summary}
										onChange={handleFormChange}
										className="w-full h-10 px-3 rounded-[var(--radius-sm)] border border-[var(--color-border-medium)] bg-[var(--color-bg)] text-sm text-[var(--color-primary)]
                    placeholder:text-[var(--color-secondary)]
                    focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
										placeholder="请输入项目简介"
									/>
								</div>

								<div className="space-y-1.5">
									<label htmlFor="description" className="block text-sm font-medium text-[var(--color-primary)]">
										项目详情
									</label>
									<textarea
										id="description"
										name="description"
										value={formData.description}
										onChange={handleFormChange}
										rows={4}
										className="w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--color-border-medium)] bg-[var(--color-bg)] text-sm text-[var(--color-primary)]
                    placeholder:text-[var(--color-secondary)] resize-none
                    focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
										placeholder="请输入项目详情（支持Markdown）"
									/>
								</div>

								<div className="space-y-1.5">
									<label htmlFor="coverImage" className="block text-sm font-medium text-[var(--color-primary)]">
										封面图片
									</label>
									<div className="space-y-2">
										<div className="flex gap-2">
											<input
												id="coverImage"
												name="coverImage"
												type="text"
												value={formData.coverImage}
												onChange={handleFormChange}
												className="flex-1 h-10 px-3 rounded-[var(--radius-sm)] border border-[var(--color-border-medium)] bg-[var(--color-bg)] text-sm text-[var(--color-primary)]
                    placeholder:text-[var(--color-secondary)]
                    focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
												placeholder="请输入封面图片 URL 或上传图片"
											/>
											<label className="flex items-center justify-center h-10 px-4 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-border-medium)] text-[var(--color-primary)] rounded-[var(--radius-sm)] cursor-pointer transition-colors">
												<Upload className="w-4 h-4 mr-2" />
												<span>{isUploading ? '上传中...' : '上传'}</span>
												<input
													type="file"
													accept="image/*"
													className="hidden"
													onChange={handleUploadCoverImage}
													disabled={isUploading}
												/>
											</label>
										</div>
										{formData.coverImage && (
											<div className="relative w-full h-32 rounded-[var(--radius-sm)] overflow-hidden border border-[var(--color-border-light)]">
												<img
													src={formData.coverImage}
													alt="封面预览"
													className="w-full h-full object-cover"
												/>
											</div>
										)}
									</div>
								</div>

								<div className="space-y-1.5">
									<label htmlFor="images" className="block text-sm font-medium text-[var(--color-primary)]">
										项目图片
									</label>
									<div className="space-y-2">
										<div className="flex gap-2">
											<textarea
												id="images"
												name="images"
												value={formData.images}
												onChange={handleFormChange}
												rows={3}
												className="flex-1 px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--color-border-medium)] bg-[var(--color-bg)] text-sm text-[var(--color-primary)]
                    placeholder:text-[var(--color-secondary)] resize-none
                    focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
												placeholder="请输入项目图片URL，每行一个"
											/>
											<label className="flex items-center justify-center px-4 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-border-medium)] text-[var(--color-primary)] rounded-[var(--radius-sm)] cursor-pointer transition-colors">
												<Upload className="w-4 h-4 mr-2" />
												<span>{isUploading ? '上传中...' : '上传'}</span>
												<input
													type="file"
													accept="image/*"
													className="hidden"
													onChange={handleUploadProjectImage}
													disabled={isUploading}
												/>
											</label>
										</div>
										{formData.images && (
											<div className="grid grid-cols-4 gap-2">
												{formData.images.split('\n').filter(Boolean).map((url, index) => (
													<div key={index} className="relative aspect-square rounded-[var(--radius-sm)] overflow-hidden border border-[var(--color-border-light)]">
														<img
															src={url}
															alt={`项目图片 ${index + 1}`}
															className="w-full h-full object-cover"
														/>
													</div>
												))}
											</div>
										)}
									</div>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--space-md)]">
									<div className="space-y-1.5">
										<label htmlFor="githubUrl" className="block text-sm font-medium text-[var(--color-primary)]">
											GitHub URL
										</label>
										<input
											id="githubUrl"
											name="githubUrl"
											type="text"
											value={formData.githubUrl}
											onChange={handleFormChange}
											className="w-full h-10 px-3 rounded-[var(--radius-sm)] border border-[var(--color-border-medium)] bg-[var(--color-bg)] text-sm text-[var(--color-primary)]
                    placeholder:text-[var(--color-secondary)]
                    focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
											placeholder="请输入 GitHub 仓库 URL"
										/>
									</div>
									<div className="space-y-1.5">
										<label htmlFor="demoUrl" className="block text-sm font-medium text-[var(--color-primary)]">
											Demo URL
										</label>
										<input
											id="demoUrl"
											name="demoUrl"
											type="text"
											value={formData.demoUrl}
											onChange={handleFormChange}
											className="w-full h-10 px-3 rounded-[var(--radius-sm)] border border-[var(--color-border-medium)] bg-[var(--color-bg)] text-sm text-[var(--color-primary)]
                    placeholder:text-[var(--color-secondary)]
                    focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
											placeholder="请输入在线演示 URL"
										/>
									</div>
								</div>

								<div className="space-y-1.5">
									<label htmlFor="tags" className="block text-sm font-medium text-[var(--color-primary)]">
										标签（用逗号分隔）
									</label>
									<input
										id="tags"
										name="tags"
										type="text"
										value={formData.tags}
										onChange={handleFormChange}
										className="w-full h-10 px-3 rounded-[var(--radius-sm)] border border-[var(--color-border-medium)] bg-[var(--color-bg)] text-sm text-[var(--color-primary)]
                    placeholder:text-[var(--color-secondary)]
                    focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
										placeholder="React, TypeScript, Node.js"
									/>
								</div>

								<div className="space-y-1.5">
									<label htmlFor="sortOrder" className="block text-sm font-medium text-[var(--color-primary)]">
										排序权重
									</label>
									<input
										id="sortOrder"
										name="sortOrder"
										type="number"
										value={formData.sortOrder}
										onChange={handleFormChange}
										className="w-full h-10 px-3 rounded-[var(--radius-sm)] border border-[var(--color-border-medium)] bg-[var(--color-bg)] text-sm text-[var(--color-primary)]
                    focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
										placeholder="0"
									/>
								</div>
							</div>

							<div className="flex items-center justify-end gap-[var(--space-sm)] px-[var(--space-lg)] py-[var(--space-md)] border-t border-[var(--color-border-light)]">
								<button
									onClick={handleCloseModal}
									className="h-10 px-[var(--space-md)] border border-[var(--color-border-medium)] text-[var(--color-primary)] rounded-[var(--radius-sm)] text-sm font-medium
                      hover:bg-[var(--color-bg-secondary)] transition-colors duration-[var(--duration-fast)]"
								>
									取消
								</button>
								<button
									onClick={handleSave}
									disabled={isSaving}
									className="inline-flex items-center gap-2 h-10 px-[var(--space-md)] bg-[var(--color-primary)] text-[var(--color-bg)] rounded-[var(--radius-sm)] text-sm font-medium
                      hover:bg-[var(--color-secondary)] transition-all duration-[var(--duration-base)] ease-standard
                      disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isSaving ? (
										<Loader2 className="w-4 h-4 animate-spin" />
									) : (
										<span>{editingProject ? '保存修改' : '添加'}</span>
									)}
								</button>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			<AnimatePresence>
				{deleteTarget && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-[var(--space-md)] bg-black/40"
						onClick={() => setDeleteTarget(null)}
					>
						<motion.div
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.95 }}
							transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
							className="w-full max-w-sm bg-[var(--color-bg)] rounded-[var(--radius-xl)] shadow-[var(--shadow-card-strong)] p-[var(--space-lg)]"
							onClick={(e) => e.stopPropagation()}
						>
							<div className="flex flex-col items-center text-center">
								<div className="w-14 h-14 rounded-[var(--radius-full)] bg-[var(--color-error)]/10 flex items-center justify-center mb-[var(--space-md)]">
									<Trash2 className="w-7 h-7 text-[var(--color-error)]" />
								</div>
								<h2 className="text-lg font-semibold text-[var(--color-primary)] mb-1">
									确认删除
								</h2>
								<p className="text-sm text-[var(--color-secondary)] mb-[var(--space-lg)]">
									确定要删除 <strong>{deleteTarget.name}</strong> 吗？此操作不可撤销。
								</p>
								<div className="flex items-center gap-[var(--space-sm)] w-full">
									<button
										onClick={() => setDeleteTarget(null)}
										className="flex-1 h-10 border border-[var(--color-border-medium)] text-[var(--color-primary)] rounded-[var(--radius-sm)] text-sm font-medium
                    hover:bg-[var(--color-bg-secondary)] transition-colors duration-[var(--duration-fast)]"
									>
										取消
									</button>
									<button
										onClick={handleDelete}
										disabled={deleteMutation.isPending}
										className="flex-1 h-10 bg-[var(--color-error)] text-[var(--color-bg)] rounded-[var(--radius-sm)] text-sm font-medium
                    hover:opacity-90 transition-all duration-[var(--duration-fast)]
                    disabled:opacity-50 disabled:cursor-not-allowed
                    inline-flex items-center justify-center gap-2"
									>
										{deleteMutation.isPending ? (
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
			</AnimatePresence>
		</div>
	)
}

export default ProjectManagePage
