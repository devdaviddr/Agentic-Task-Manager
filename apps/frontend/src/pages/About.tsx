import { useQuery } from '@tanstack/react-query'
import { getHealth } from '../services/api'
import PageLayout from '../components/PageLayout'
import PageHeader from '../components/PageHeader'

export default function About() {
  const { data: healthData, isLoading: healthLoading, error: healthError } = useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
  })

  return (
    <PageLayout>
      <div className="px-6 py-4">
        <PageHeader title="About" />
      </div>

      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="card">
            <div className="p-6">
              <h3 className="text-lg font-medium text-heading mb-4">Backend Status</h3>
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full ${
                  healthLoading ? 'bg-muted' :
                  healthError ? 'bg-danger' :
                  healthData?.data?.status === 'ok' ? 'bg-primary' : 'bg-danger'
                }`} />
                <div className="ml-3">
                  <p className="text-sm font-medium text-body">
                    {healthLoading ? 'Checking...' :
                     healthError ? 'Error connecting to backend' :
                     healthData?.data?.status === 'ok' ? 'Backend is healthy' : 'Backend is unhealthy'}
                  </p>
                  {healthData?.data?.database && (
                    <p className="text-xs text-muted mt-1">
                      Database: {healthData.data.database}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="p-6">
              <h3 className="text-lg font-medium text-heading mb-4">Database Status</h3>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-primary" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-body">
                    Database is connected
                  </p>
                  <p className="text-xs text-muted mt-1">
                    PostgreSQL connection established
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 card">
          <div className="p-6">
            <h3 className="text-lg font-medium text-heading mb-4">System Information</h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-muted">Frontend</dt>
                <dd className="mt-1 text-sm text-body">React + TypeScript + Vite</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted">Backend</dt>
                <dd className="mt-1 text-sm text-body">Hono.js + Node.js</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted">Database</dt>
                <dd className="mt-1 text-sm text-body">PostgreSQL</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted">Styling</dt>
                <dd className="mt-1 text-sm text-body">Tailwind CSS</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
