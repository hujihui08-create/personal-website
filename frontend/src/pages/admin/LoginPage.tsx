import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Loader2, ArrowLeft } from 'lucide-react'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'sonner'

interface LoginPageProps {
  onSuccess?: () => void
}

export const LoginPage = ({ onSuccess }: LoginPageProps) => {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const normalizedPassword = password.trim()
    if (!normalizedPassword) {
      setError('请输入管理员密码')
      toast.error('请输入管理员密码')
      return
    }
    setIsLoading(true)

    try {
      const response = await authApi.login({ password: normalizedPassword })
      login(response.token, { id: 1, name: 'Admin', email: '' })
      toast.success('登录成功')
      if (onSuccess) {
        onSuccess()
      } else {
        navigate('/admin/dashboard')
      }
    } catch (err: any) {
      if (err.response?.data?.error?.message) {
        setError(err.response.data.error.message)
        toast.error(err.response.data.error.message)
      } else {
        setError('登录失败，请稍后重试')
        toast.error('网络错误', { description: '请检查网络后重试' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-tertiary">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md px-4"
      >
        <div className="bg-background rounded-xl border border-border-light p-8 shadow-card-hover">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-background" aria-label="管理员登录" />
            </div>
            <h1 className="text-2xl font-semibold text-primary mb-2">
              管理后台登录
            </h1>
            <p className="text-sm text-secondary text-center">
              输入密码以访问管理后台
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-primary">
                密码
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入管理员密码"
                disabled={isLoading}
                className="w-full h-11 px-4 rounded-[var(--radius-sm)] border border-border-medium bg-background text-primary placeholder:text-secondary
                  transition-all duration-200
                  focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft
                  disabled:bg-background-secondary disabled:border-border-light disabled:cursor-not-allowed"
                aria-describedby={error ? 'password-error' : undefined}
              />
            </div>

            {error && (
              <p id="password-error" className="text-sm text-error text-center" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-primary text-background rounded-[var(--radius-sm)] font-medium
                transition-all duration-200
                hover:bg-secondary
                focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
                disabled:bg-border-light disabled:text-secondary disabled:cursor-not-allowed
                flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>登录中...</span>
                </>
              ) : (
                <span>登录</span>
              )}
            </button>
          </form>

          <div className="mt-6">
            <Link
              to="/"
              className="flex items-center justify-center gap-2 w-full h-11 border border-border-medium text-primary rounded-[var(--radius-sm)] text-sm font-medium
                hover:border-accent hover:text-accent hover:bg-accent-soft transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>返回首页</span>
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-secondary mt-4">
          2026 © 个人简介网站
        </p>
      </motion.div>
    </div>
  )
}
