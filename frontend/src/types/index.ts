export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'admin' | 'user'
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  title: string
  description: string
  thumbnail?: string
  images?: string[]
  tags?: string[]
  demoUrl?: string
  repoUrl?: string
  featured: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export interface WorkExperience {
  id: string
  company: string
  position: string
  description: string
  startDate: string
  endDate?: string
  current: boolean
  order: number
}

export interface Booking {
  id: string
  name: string
  email: string
  phone?: string
  purpose: string
  preferredDate?: string
  preferredTime?: string
  message?: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  createdAt: string
  updatedAt: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}
