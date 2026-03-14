import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { usersAPI } from '../services/api'

export default function AccountSettings() {
  const { user, logout, setUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleLogout = async () => {
    await logout()
    window.location.href = '/'
  }

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const email = formData.get('email') as string

    try {
      const response = await usersAPI.update(user!.id, { name: name || undefined, email: email || undefined })
      setUser(response.data)
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    } catch (error) {
      console.error('Failed to update profile:', error)
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Account Settings */}
      <div className="card">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-heading mb-4">Account Information</h3>
          {message && (
            <div className={`mb-4 p-4 rounded-md ${message.type === 'success' ? 'bg-primary/15 text-primary' : 'bg-danger/15 text-danger'}`}>
              {message.text}
            </div>
          )}
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-body">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                className="input mt-1"
                placeholder="Enter your full name"
                defaultValue={user?.name || ''}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-body">
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                className="input mt-1"
                placeholder="Enter your email"
                defaultValue={user?.email || ''}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-body">
                Account ID
              </label>
              <div className="mt-1 block w-full px-3 py-2 border border-border rounded-md bg-panel text-muted sm:text-sm">
                {user?.id || 'N/A'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-body">
                Role
              </label>
              <div className="mt-1 block w-full px-3 py-2 border border-border rounded-md bg-panel text-muted sm:text-sm">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  user?.role === 'user' ? 'bg-secondary/20 text-secondary' :
                  user?.role === 'admin' ? 'bg-primary/20 text-primary' :
                  user?.role === 'superadmin' ? 'bg-danger/20 text-danger' :
                  'bg-panel/10 text-muted'
                }`}>
                  {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'N/A'}
                </span>
              </div>
            </div>
            <div className="pt-4 flex space-x-4">
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary"
              >
                {isLoading ? 'Updating...' : 'Update Profile'}
              </button>
              <button
                onClick={handleLogout}
                className="btn btn-secondary"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}