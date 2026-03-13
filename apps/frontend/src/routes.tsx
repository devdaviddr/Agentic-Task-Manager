import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Board from './pages/Board'
import SettingsLayout from './pages/Settings'
import AccountSettings from './pages/AccountSettings'
import SystemUsers from './pages/SystemUsers'
import SystemHealth from './pages/SystemHealth'

export const AppRoutes = () => (
  <AuthProvider>
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
  </AuthProvider>
)
