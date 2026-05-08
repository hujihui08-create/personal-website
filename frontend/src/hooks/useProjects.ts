import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectApi, type ListProjectsParams } from '@/api/projects'
import { toast } from 'sonner'

export function useProjects(params?: ListProjectsParams) {
	return useQuery({
		queryKey: ['projects', params],
		queryFn: () => projectApi.list(params),
		staleTime: 3600000,
	})
}

export function useFeaturedProjects(limit?: number) {
	return useQuery({
		queryKey: ['projects', 'featured', limit],
		queryFn: () => projectApi.listFeatured(limit),
		staleTime: 0,
		gcTime: 0,
	})
}

export function useProject(id?: number) {
	return useQuery({
		queryKey: ['projects', id],
		queryFn: () => id ? projectApi.getById(id) : Promise.reject(new Error('No ID provided')),
		enabled: !!id,
		staleTime: 3600000,
	})
}

export function useCreateProject() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (data: Parameters<typeof projectApi.create>[0]) => projectApi.create(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['projects'] })
			toast.success('作品已创建')
		},
		onError: () => {
			toast.error('创建失败', { description: '请稍后重试' })
		},
	})
}

export function useUpdateProject() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ id, data }: { id: number; data: Parameters<typeof projectApi.update>[1] }) =>
			projectApi.update(id, data),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: ['projects'] })
			queryClient.invalidateQueries({ queryKey: ['projects', id] })
			toast.success('作品已更新')
		},
		onError: () => {
			toast.error('更新失败', { description: '请稍后重试' })
		},
	})
}

export function useDeleteProject() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (id: number) => projectApi.delete(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['projects'] })
			toast.success('作品已删除')
		},
		onError: () => {
			toast.error('删除失败', { description: '请稍后重试' })
		},
	})
}

export function useReorderProjects() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (ids: number[]) => projectApi.reorder(ids),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['projects'] })
			toast.success('排序已更新')
		},
		onError: () => {
			toast.error('排序更新失败', { description: '请稍后重试' })
		},
	})
}
