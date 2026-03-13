import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

// Lazy-load pages to enable route-based code splitting
const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Board = lazy(() => import('./pages/Board'))
const SettingsLayout = lazy(() => import('./pages/Settings'))
const AccountSettings = lazy(() => import('./pages/AccountSettings'))
const SystemUsers = lazy(() => import('./pages/SystemUsers'))
const SystemHealth = lazy(() => import('./pages/SystemHealth'))

const PageFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
  </div>
)

export const AppRoutes = () => (
  <AuthProvider>
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/app" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="board/:id" element={<Board />} />
          <Route path="settings" element={<SettingsLayout />}>
            <Route index element={<AccountSettings />} />
            <Route path="system-users" element={<SystemUsers />} />
            <Route path="system-health" element={<SystemHealth />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  </AuthProvider>
)
