import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { LoginPage } from '@/pages/admin/LoginPage'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<div>Portfolio Home</div>} />
      <Route path="/admin/login" element={<LoginPage />} />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <div>Dashboard</div>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
