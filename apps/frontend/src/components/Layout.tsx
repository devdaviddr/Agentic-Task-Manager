import { Outlet, Link } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="min-h-screen bg-page text-body">
      <nav className="bg-panel border-b border-border h-16">
        <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center">
          <Link to="/app" className="text-xl font-bold text-heading">
            Task Manager
          </Link>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar />
        <main className="flex-1 overflow-x-auto overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}