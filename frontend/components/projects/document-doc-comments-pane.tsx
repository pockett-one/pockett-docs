'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { MessageSquare, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatSmartDateTime } from '@/lib/utils'

export interface DocumentDocCommentsPaneProps {
  projectId: string
  documentId: string
  documentName?: string
}

type CommentMessage = {
  id: string
  createdAt: string
  authorUserId: string | null
  content: string
}

export function DocumentDocCommentsPane({ projectId, documentId, documentName }: DocumentDocCommentsPaneProps) {
  const [messages, setMessages] = useState<CommentMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newContent, setNewContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchMessages = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/documents/${documentId}/doc-comments`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to load comments')
      }
      const data = await res.json()
      setMessages(data.messages ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load comments')
    } finally {
      setLoading(false)
    }
  }, [projectId, documentId])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const content = newContent.trim()
    if (!content || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/documents/${documentId}/doc-comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to add comment')
      }
      const data = await res.json()
      setMessages((prev) => [...prev, data.message])
      setNewContent('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add comment')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <p className="text-xs text-gray-500 mb-3">
        Comments are permanent and cannot be edited. Visible to all project members.
      </p>
      {documentName && (
        <p className="text-sm font-medium text-gray-700 truncate mb-2" title={documentName}>
          {documentName}
        </p>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto min-h-0 space-y-3 mb-4">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading comments…
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <MessageSquare className="h-10 w-10 text-gray-300 mb-2" />
            <p className="text-sm">No comments yet. Add one below.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className="rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2 text-sm"
            >
              <div className="flex items-center justify-between gap-2 text-xs text-gray-500 mb-1">
                <span>{msg.authorUserId ? 'User' : 'Unknown'}</span>
                <span>{formatSmartDateTime(msg.createdAt)}</span>
              </div>
              <p className="text-gray-900 whitespace-pre-wrap break-words">{msg.content}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 shrink-0">
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Add a comment…"
          rows={2}
          className="flex-1 min-w-0 rounded-md border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 resize-none"
          disabled={submitting}
        />
        <Button type="submit" size="icon" className="shrink-0 h-9 w-9" disabled={submitting || !newContent.trim()}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  )
}
