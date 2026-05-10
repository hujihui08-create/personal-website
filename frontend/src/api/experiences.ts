import client from './client'
import type { WorkExperience, ApiResponse } from '../types'

export interface CreateExperienceRequest {
  type: 'study' | 'internship' | 'work'
  companyName: string
  position: string
  startDate: string
  endDate?: string | null
  description?: string
  sortOrder?: number
  projectIds?: number[]
}

export function getExperiences(): Promise<ApiResponse<WorkExperience[]>> {
  return client.get('/experiences').then(res => res.data)
}

export function createExperience(data: CreateExperienceRequest): Promise<ApiResponse<WorkExperience>> {
  return client.post('/experiences', data).then(res => res.data)
}

export function updateExperience(id: number, data: Partial<CreateExperienceRequest>): Promise<ApiResponse<WorkExperience>> {
  return client.put(`/experiences/${id}`, data).then(res => res.data)
}

export function deleteExperience(id: number): Promise<ApiResponse<null>> {
  return client.delete(`/experiences/${id}`).then(res => res.data)
}

export function reorderExperiences(ids: number[]): Promise<ApiResponse<null>> {
  return client.put('/experiences/reorder', { ids }).then(res => res.data)
}
