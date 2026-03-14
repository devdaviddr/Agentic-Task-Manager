import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PencilIcon } from '@heroicons/react/24/outline'
import PageLayout from '../components/PageLayout'
import PageHeader from '../components/PageHeader'
import { boardsAPI } from '../services/api'
import EditBoardModal from '../components/sections/EditBoardModal'

interface Board {
  id: number
  name: string
  description?: string
  background?: string
  archived: boolean
  user_id: number
  created_at: string
  updated_at: string
}

export default function Dashboard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newBoardName, setNewBoardName] = useState('')
  const [newBoardDescription, setNewBoardDescription] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'created_at'>('created_at')
  const [showArchived, setShowArchived] = useState(false)
  const [menuOpen, setMenuOpen] = useState<number | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingBoard, setEditingBoard] = useState<Board | null>(null)
  const [editBoardName, setEditBoardName] = useState('')
  const [editBoardDescription, setEditBoardDescription] = useState('')

  const { data: boards = [], isLoading, error } = useQuery({
    queryKey: ['boards'],
    queryFn: async () => {
      const response = await boardsAPI.getAll()
      return response.data as Board[]
    },
  })

  const createBoardMutation = useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      boardsAPI.create({ name, description }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['boards'] })
      setIsCreateModalOpen(false)
      setNewBoardName('')
      setNewBoardDescription('')
      navigate(`/app/board/${data.data.id}`)
    },
  })

  const deleteBoardMutation = useMutation({
    mutationFn: (id: number) => boardsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] })
      setIsEditModalOpen(false)
      setEditingBoard(null)
      setEditBoardName('')
      setEditBoardDescription('')
    },
  })

  const duplicateBoardMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) =>
      boardsAPI.create({ name, description }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['boards'] })
      setIsEditModalOpen(false)
      setEditingBoard(null)
      setEditBoardName('')
      setEditBoardDescription('')
      navigate(`/app/board/${data.data.id}`)
    },
  })

  const updateBoardMutation = useMutation({
    mutationFn: ({ id, name, description }: { id: number; name: string; description?: string }) =>
      boardsAPI.update(id, { name, description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] })
      setIsEditModalOpen(false)
      setEditingBoard(null)
      setEditBoardName('')
      setEditBoardDescription('')
    },
  })

  const handleBoardClick = (boardId: number) => {
    navigate(`/app/board/${boardId}`)
  }

  const handleCreateBoard = () => {
    setIsCreateModalOpen(true)
  }

  const handleCreateBoardSubmit = () => {
    if (newBoardName.trim()) {
      createBoardMutation.mutate({
        name: newBoardName.trim(),
        description: newBoardDescription.trim() || undefined,
      })
    }
  }

  const handleCloseModal = () => {
    setIsCreateModalOpen(false)
    setNewBoardName('')
    setNewBoardDescription('')
  }

  const handleDuplicateBoard = (board: Board) => {
    const newName = `${board.name} (Copy)`
    duplicateBoardMutation.mutate({
      name: newName,
      description: board.description,
    })
  }

  const handleDeleteBoard = (board: Board) => {
    if (window.confirm(`Are you sure you want to delete "${board.name}"? This action cannot be undone.`)) {
      deleteBoardMutation.mutate(board.id)
    }
  }

  const handleEditBoard = (board: Board) => {
    setEditingBoard(board)
    setEditBoardName(board.name)
    setEditBoardDescription(board.description || '')
    setIsEditModalOpen(true)
    setMenuOpen(null)
  }

  const handleEditBoardSubmit = () => {
    if (editingBoard && editBoardName.trim()) {
      updateBoardMutation.mutate({
        id: editingBoard.id,
        name: editBoardName.trim(),
        description: editBoardDescription.trim() || undefined,
      })
    }
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setEditingBoard(null)
    setEditBoardName('')
    setEditBoardDescription('')
  }

  const filteredAndSortedBoards = boards
    .filter(board => showArchived || !board.archived)
    .filter(board =>
      board.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (board.description && board.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      } else {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })



  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader title="Dashboard" />
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </PageLayout>
    )
  }

  if (error) {
    return (
      <PageLayout>
        <PageHeader title="Dashboard" />
        <div className="text-center py-12">
          <p className="text-danger">Failed to load boards. Please try again.</p>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="w-full">
        <div className="px-6 py-1">
          <PageHeader title="Dashboard" />
        </div>

        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="text-lg font-semibold text-heading mb-4 sm:mb-0">Your Boards</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search boards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10 w-full sm:w-64"
                />
              </div>
               <select
                 value={sortBy}
                 onChange={(e) => setSortBy(e.target.value as 'name' | 'created_at')}
                 className="select"
               >
                 <option value="created_at">Sort by Date</option>
                 <option value="name">Sort by Name</option>
               </select>
               <button
                 onClick={() => setShowArchived(!showArchived)}
                 className={`btn btn-secondary ${
                   showArchived
                     ? 'text-primary bg-primary/10 border-primary'
                     : 'text-muted bg-panel border-border'
                 }`}
               >
                 <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                 </svg>
                 {showArchived ? 'Hide Archived' : 'Show Archived'}
               </button>
              <button
                onClick={handleCreateBoard}
                className="btn btn-primary"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Board
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {filteredAndSortedBoards.map((board, index) => {
              const gradients = [
                'from-primary/30 to-tertiary/30',
                'from-secondary/30 to-primary/30',
                'from-tertiary/30 to-secondary/30',
              ]
              const gradient = gradients[index % gradients.length]

              return (
                <div
                  key={board.id}
                  onClick={() => handleBoardClick(board.id)}
                  className={`relative bg-gradient-to-br ${gradient} rounded-card shadow-lg border border-border p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group overflow-hidden ${board.archived ? 'opacity-60' : ''}`}
                >
                  <div className="absolute inset-0 bg-panel/50 group-hover:bg-panel/70 transition-colors duration-300"></div>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-heading mb-2 line-clamp-1">{board.name}</h3>
                        {board.description && (
                          <p className="text-body/80 text-sm mb-3 line-clamp-2">{board.description}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {board.archived && (
                          <span className="px-2 py-1 text-xs font-medium text-body bg-page/30 rounded-full">
                            Archived
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setMenuOpen(menuOpen === board.id ? null : board.id)
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-panel/20 transition-all duration-200"
                        >
                          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                        <div className="opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                          <svg className="w-8 h-8 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {menuOpen === board.id && (
                        <div className="absolute top-12 right-2 bg-panel rounded-lg shadow-lg border border-border py-1 z-20 min-w-32">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditBoard(board)
                            }}
                            disabled={updateBoardMutation.isPending}
                            className="w-full text-left px-3 py-2 text-sm text-body hover:bg-panel/10 flex items-center disabled:opacity-50"
                          >
                            <PencilIcon className="w-4 h-4 mr-2 text-primary" />
                            {updateBoardMutation.isPending ? 'Editing...' : 'Edit'}
                          </button>
                        </div>
                      )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-muted/70 text-xs">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(board.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-muted/70 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        Click to open →
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredAndSortedBoards.length === 0 && boards.length > 0 && (
            <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-heading">No boards found</h3>
                <p className="mt-1 text-sm text-muted">Try adjusting your search or create a new board.</p>
              </div>
          )}

          {boards.length === 0 && (
            <div className="text-center py-16">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-primary/30 to-tertiary/30 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-heading mb-2">Welcome to TaskManager!</h3>
              <p className="text-muted mb-8 max-w-md mx-auto">
                Create your first kanban board to start organizing your tasks and projects.
                Break down work into manageable columns and track progress visually.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleCreateBoard}
                  className="btn btn-primary px-6 py-3"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Your First Board
                </button>
                <button
                  onClick={() => window.open('https://github.com/sst/opencode', '_blank')}
                  className="btn btn-secondary px-6 py-3"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Learn More
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Board Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-page/70 flex items-center justify-center z-50">
          <div className="card w-full max-w-md mx-4 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-heading">Create New Board</h2>
              <button
                onClick={handleCloseModal}
                className="text-muted hover:text-body"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-body mb-1">
                  Board Name *
                </label>
                <input
                  type="text"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  placeholder="Enter board name"
                  className="input"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateBoardSubmit()}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-body mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={newBoardDescription}
                  onChange={(e) => setNewBoardDescription(e.target.value)}
                  placeholder="Enter board description"
                  rows={3}
                  className="textarea"
                />
              </div>
            </div>

            <div className="flex justify-end items-center mt-6 space-x-3">
              <button
                onClick={handleCloseModal}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBoardSubmit}
                disabled={createBoardMutation.isPending || !newBoardName.trim()}
                className="btn btn-primary"
              >
                {createBoardMutation.isPending ? 'Creating...' : 'Create Board'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Board Modal */}
      <EditBoardModal
        isOpen={isEditModalOpen}
        boardName={editBoardName}
        boardDescription={editBoardDescription}
        onNameChange={setEditBoardName}
        onDescriptionChange={setEditBoardDescription}
        onSave={handleEditBoardSubmit}
        onClose={handleCloseEditModal}
        savePending={updateBoardMutation.isPending}
        onDuplicate={editingBoard ? () => handleDuplicateBoard(editingBoard) : undefined}
        onDelete={editingBoard ? () => handleDeleteBoard(editingBoard) : undefined}
        duplicatePending={duplicateBoardMutation.isPending}
        deletePending={deleteBoardMutation.isPending}
      />
    </PageLayout>
  )
}
