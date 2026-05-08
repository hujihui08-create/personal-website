import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getExperiences,
  createExperience,
  updateExperience,
  deleteExperience,
  reorderExperiences,
} from '@/api/experiences'
import type { CreateExperienceRequest } from '@/api/experiences'
import { toast } from 'sonner'

export function useExperiences() {
  return useQuery({
    queryKey: ['experiences'],
    queryFn: () => getExperiences().then(res => res.data),
    staleTime: 3600000,
  })
}

export function useCreateExperience() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateExperienceRequest) => createExperience(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] })
      toast.success('工作经历已添加')
    },
    onError: () => {
      toast.error('添加失败', { description: '请稍后重试' })
    },
  })
}

export function useUpdateExperience() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateExperienceRequest> }) =>
      updateExperience(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] })
      toast.success('工作经历已更新')
    },
    onError: () => {
      toast.error('更新失败', { description: '请稍后重试' })
    },
  })
}

export function useDeleteExperience() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteExperience(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] })
      toast.success('工作经历已删除')
    },
    onError: () => {
      toast.error('删除失败', { description: '请稍后重试' })
    },
  })
}

export function useReorderExperiences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ids: number[]) => reorderExperiences(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] })
      toast.success('排序已更新')
    },
    onError: () => {
      toast.error('排序更新失败', { description: '请稍后重试' })
    },
  })
}
