import { useNavigate } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Unauthorized() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="card max-w-md w-full text-center py-12 px-8">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30">
            <ShieldOff className="w-10 h-10 text-red-500" />
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-[var(--pb-text-primary)] mb-2">
          Access denied
        </h1>
        <p className="text-[var(--pb-text-secondary)] mb-8">
          You don't have permission to view this page.
          Contact your administrator if you believe this is a mistake.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
          >
            Go back
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-primary"
          >
            Dashboard
          </button>
        </div>

        <button
          onClick={logout}
          className="mt-6 text-sm text-[var(--pb-text-tertiary)] hover:text-[var(--pb-text-secondary)] underline"
        >
          Sign in as a different user
        </button>
      </div>
    </div>
  )
}