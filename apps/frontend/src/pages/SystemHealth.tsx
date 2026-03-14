import { useQuery } from '@tanstack/react-query'
import { healthAPI } from '../services/api'

export default function SystemHealth() {
  const { data: health, isLoading, error } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await healthAPI.get()
      return response.data
    },
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-danger">Failed to load system health. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-heading">Backend Status</h3>
          <p className="mt-1 text-sm text-muted">
            Backend is {health?.status || 'unknown'}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-heading">Database Status</h3>
          <p className="mt-1 text-sm text-muted">
            Database: {health?.database || 'unknown'}
          </p>
          {health?.database === 'connected' && (
            <p className="mt-2 text-sm text-muted">
              PostgreSQL connection established
            </p>
          )}
        </div>
      </div>

      {health && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card">
            <div className="px-4 py-5 sm:p-6">
              <h4 className="text-sm font-medium text-heading">Environment</h4>
              <p className="mt-1 text-sm text-muted">{health.environment}</p>
            </div>
          </div>
          <div className="card">
            <div className="px-4 py-5 sm:p-6">
              <h4 className="text-sm font-medium text-heading">Uptime</h4>
              <p className="mt-1 text-sm text-muted">{Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m</p>
            </div>
          </div>
          <div className="card">
            <div className="px-4 py-5 sm:p-6">
              <h4 className="text-sm font-medium text-heading">Node Version</h4>
              <p className="mt-1 text-sm text-muted">{health.version}</p>
            </div>
          </div>
          <div className="card">
            <div className="px-4 py-5 sm:p-6">
              <h4 className="text-sm font-medium text-heading">Last Check</h4>
              <p className="mt-1 text-sm text-muted">{new Date(health.timestamp).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}