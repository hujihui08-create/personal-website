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

export interface Profile {
  name: string
  title: string
  bio: string
  avatar_url: string
  github_url: string
  linkedin_url: string
  email: string
  skills: string[]
}

export interface Project {
	id: number
	name: string
	type: 'enterprise' | 'personal'
	startDate?: string
	endDate?: string
	summary: string
	description: string
	coverImage: string
	images: string[]
	githubUrl: string
	demoUrl: string
	tags: string[]
	sortOrder: number
	createdAt: string
	updatedAt: string
}

export interface PaginatedProjectsResponse {
	items: Project[]
	total: number
	page: number
	pageSize: number
}

export interface WorkExperience {
  id: number
  type?: 'study' | 'internship' | 'work'
  company_name: string
  position: string
  start_date: string
  end_date: string | null
  description: string
  sort_order: number
  projects?: Project[]
}

export interface Resume {
  file_url: string
  file_name: string
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
