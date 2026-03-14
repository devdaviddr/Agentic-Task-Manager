import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { adminAPI } from '../services/api'
import UserDetailsModal from '../components/sections/UserDetailsModal'

interface User {
  id: number
  email: string
  name?: string
  role: 'user' | 'admin' | 'superadmin'
  created_at: string
  updated_at: string
}

export default function SystemUsers() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const response = await adminAPI.getAllUsers()
      setUsers(response.data)
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUserClick = (user: User) => {
    setSelectedUser(user)
    setModalOpen(true)
  }

  const handleSaveUser = async (id: number, data: { role?: 'user' | 'admin' | 'superadmin'; name?: string; email?: string }) => {
    try {
      await adminAPI.updateUserDetails(id, data)
      await loadUsers()
    } catch (error) {
      console.error('Failed to update user:', error)
      throw error
    }
  }

  const handleDeleteUser = async (id: number) => {
    try {
      await adminAPI.deleteUser(id)
      await loadUsers()
    } catch (error) {
      console.error('Failed to delete user:', error)
      throw error
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-danger/20 text-danger'
      case 'admin': return 'bg-primary/20 text-primary'
      case 'user': return 'bg-secondary/20 text-secondary'
      default: return 'bg-panel/10 text-muted'
    }
  }

  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'superadmin')) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-heading mb-4">Access Denied</h2>
          <p className="text-muted">You need administrator privileges to view this page.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-heading mb-4">System Users</h3>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-panel">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-panel divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id} className="cursor-pointer hover:bg-panel/10" onClick={() => handleUserClick(user)}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                      {user.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-body">
                            {user.name || 'No name'}
                          </div>
                          <div className="text-sm text-muted">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <UserDetailsModal
        user={selectedUser}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveUser}
        onDelete={handleDeleteUser}
        currentUser={currentUser}
      />
    </div>
  )
}