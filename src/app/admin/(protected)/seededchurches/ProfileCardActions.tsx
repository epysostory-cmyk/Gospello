'use client'

import { useState, useTransition } from 'react'
import { Eye, EyeOff, Trash2, AlertTriangle, X } from 'lucide-react'
import { toggleProfileHidden, deleteProfile } from './actions'

interface Props {
  id: string
  type: 'church' | 'organizer'
  name: string
  isHidden: boolean
}

export default function ProfileCardActions({ id, type, name, isHidden }: Props) {
  const [hidden, setHidden] = useState(isHidden)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isDeleting, startDelete] = useTransition()

  function handleToggleHidden() {
    startTransition(async () => {
      const result = await toggleProfileHidden(id, type, hidden)
      if (!result.error) setHidden(result.hidden ?? !hidden)
    })
  }

  function handleDelete() {
    setDeleteError(null)
    startDelete(async () => {
      const result = await deleteProfile(id, type)
      if (result.error) {
        setDeleteError(result.error)
      } else {
        setShowDeleteModal(false)
      }
    })
  }

  return (
    <>
      {/* Hide / Unhide toggle */}
      <button
        onClick={handleToggleHidden}
        disabled={isPending}
        title={hidden ? 'Make visible' : 'Hide from public'}
        className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
          hidden
            ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
            : 'text-gray-500 bg-gray-50 hover:bg-gray-100'
        }`}
      >
        {hidden
          ? <><Eye className="w-3 h-3" /> Show</>
          : <><EyeOff className="w-3 h-3" /> Hide</>
        }
      </button>

      {/* Delete button */}
      <button
        onClick={() => { setDeleteError(null); setShowDeleteModal(true) }}
        title="Delete profile"
        className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
      >
        <Trash2 className="w-3 h-3" /> Delete
      </button>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteModal(false) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-base">Delete profile?</h3>
                <p className="text-sm text-gray-500 mt-0.5 break-words">
                  <span className="font-semibold text-gray-700">{name}</span> will be permanently removed. This cannot be undone.
                </p>
              </div>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {deleteError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                {deleteError}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {isDeleting ? 'Deleting…' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
