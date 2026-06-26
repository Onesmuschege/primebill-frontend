import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import './index.css'
import App from './App.jsx'

// Apply saved theme before first paint to avoid flash
const savedTheme = localStorage.getItem('pb-theme')
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
  document.documentElement.classList.add('dark')
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// PROVIDER ORDER — do not reorder:
//
// BrowserRouter must wrap AuthProvider because AuthContext calls useNavigate().
// useNavigate() is a React Router hook — it throws if called outside a Router.
// This was the root cause of the login page breaking after AuthContext was updated.
//
// AuthProvider must wrap QueryClientProvider so that authenticated API calls
// in TanStack Query hooks can read the token from AuthContext if needed.
//
// ThemeProvider sits outermost because it has no dependencies on auth or routing.

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: 'var(--pb-surface)',
                  color: 'var(--pb-text-1)',
                  border: '1px solid var(--pb-border)',
                  fontSize: '0.875rem',
                },
                success: {
                  iconTheme: { primary: '#10b981', secondary: 'var(--pb-surface)' },
                },
                error: {
                  iconTheme: { primary: '#ef4444', secondary: 'var(--pb-surface)' },
                },
              }}
            />
          </QueryClientProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)