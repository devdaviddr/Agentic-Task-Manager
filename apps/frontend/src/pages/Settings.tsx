import { Outlet, useLocation, Link } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../hooks/useAuth'

const SettingsLayout = () => {
  const location = useLocation()
  const { user } = useAuth()

  const baseTabs = [
    { name: 'Account', href: '/app/settings', current: location.pathname === '/app/settings' },
  ]

  const adminTabs = [
    { name: 'System Users', href: '/app/settings/system-users', current: location.pathname === '/app/settings/system-users' },
    { name: 'System Health', href: '/app/settings/system-health', current: location.pathname === '/app/settings/system-health' },
  ]

  const tabs = user && (user.role === 'admin' || user.role === 'superadmin') ? [...baseTabs, ...adminTabs] : baseTabs

  return (
    <PageLayout>
      <div className="px-6 py-4">
        <PageHeader title="Settings" />
      </div>

      <div className="px-6 pb-6">
        <div className="border-b border-border">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <Link
                key={tab.name}
                to={tab.href}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  tab.current
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted hover:text-body hover:border-border'
                }`}
              >
                {tab.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8">
          <Outlet />
        </div>
      </div>
    </PageLayout>
  )
}

export default SettingsLayout
