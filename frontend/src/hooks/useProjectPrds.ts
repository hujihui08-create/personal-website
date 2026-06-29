import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectPrdApi } from '@/api/project-prds'
import { toast } from 'sonner'

export function useProjectPrds(projectId: number | undefined) {
  return useQuery({
    queryKey: ['project-prds', projectId],
    queryFn: () => (projectId ? projectPrdApi.list(projectId) : Promise.resolve([])),
    enabled: !!projectId,
    staleTime: 0,
  })
}

export function useCreatePrd() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      projectId,
      data,
    }: {
      projectId: number
      data: { name: string; prd_url?: string; file?: File }
    }) => projectPrdApi.create(projectId, data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-prds', projectId] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('PRD 已添加')
    },
    onError: () => {
      toast.error('添加 PRD 失败', { description: '请稍后重试' })
    },
  })
}

export function useDeletePrd() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, prdId }: { projectId: number; prdId: number }) =>
      projectPrdApi.delete(projectId, prdId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-prds', projectId] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('PRD 已删除')
    },
    onError: () => {
      toast.error('删除 PRD 失败', { description: '请稍后重试' })
    },
  })
}

export function useMovePrdUp() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, prdId }: { projectId: number; prdId: number }) =>
      projectPrdApi.moveUp(projectId, prdId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-prds', projectId] })
    },
    onError: () => {
      toast.error('上移失败', { description: '请稍后重试' })
    },
  })
}

export function useMovePrdDown() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, prdId }: { projectId: number; prdId: number }) =>
      projectPrdApi.moveDown(projectId, prdId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-prds', projectId] })
    },
    onError: () => {
      toast.error('下移失败', { description: '请稍后重试' })
    },
  })
}
