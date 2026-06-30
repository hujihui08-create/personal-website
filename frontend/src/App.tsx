import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { Navbar } from '@/components/Navbar'
import { MobileTabBar } from '@/components/MobileTabBar'
import { AdminLayout } from '@/components/AdminLayout'
import { LoginPage } from '@/pages/admin/LoginPage'
import { DashboardPage } from '@/pages/admin/DashboardPage'
import HomePage from '@/pages/home'
import ProjectsPage from '@/pages/projects'
import ProjectDetailPage from '@/pages/projects/[id]'
import AgentPage from '@/pages/agent'
import BookingPage from '@/pages/booking'
import ProfileEditPage from '@/pages/admin/ProfileEditPage'
import ExperienceManagePage from '@/pages/admin/ExperienceManagePage'
import ProjectManagePage from '@/pages/admin/ProjectManagePage'
import BookingManagePage from '@/pages/admin/BookingManagePage'
import NotificationManagePage from '@/pages/admin/NotificationManagePage'
import ScheduleManagePage from '@/pages/admin/ScheduleManagePage'
import KnowledgeManagePage from '@/pages/admin/KnowledgeManagePage'
import SettingsPage from '@/pages/admin/SettingsPage'
import AgentConfigPage from '@/pages/admin/agent-config'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }

  return <>{children}</>
}

const isAdminRoute = (pathname: string) => {
  return pathname.startsWith('/admin')
}

function App() {
  const location = useLocation()
  const showNavigation = !isAdminRoute(location.pathname)

  useEffect(() => {
    if (location.pathname !== '/agent') {
      window.scrollTo(0, 0)
    }
  }, [location.pathname])

  return (
    <div className="min-h-screen">
      {showNavigation && (
        <>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[var(--z-modal)] px-4 py-2 bg-[var(--color-accent)] text-[var(--color-bg)] rounded-[var(--radius-md)] font-medium"
          >
            跳到主要内容
          </a>
          <Navbar />
        </>
      )}
      <div className={showNavigation ? 'pt-16 pb-24 md:pb-0' : ''}>
        <main id="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/agent" element={<AgentPage />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/admin/login" element={<LoginPage />} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <DashboardPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/profile"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <ProfileEditPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/experiences"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <ExperienceManagePage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/projects"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <ProjectManagePage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/bookings"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <BookingManagePage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/schedule"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <ScheduleManagePage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/notifications"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <NotificationManagePage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/knowledge"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <KnowledgeManagePage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <SettingsPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/agent"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <AgentConfigPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
      {showNavigation && <MobileTabBar />}
    </div>
  )
}

export default App
