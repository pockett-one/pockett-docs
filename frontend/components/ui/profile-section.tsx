"use client"

import { useState, useRef, useLayoutEffect, useEffect } from "react"
import { createPortal } from "react-dom"
import { LogOut, ChevronDown } from "lucide-react"
import { ProfileBubble, ProfileBubblePopupContent } from "@/components/ui/profile-bubble-popup"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface ProfileSectionProps {
  user: {
    email?: string
    user_metadata?: {
      full_name?: string
      name?: string
      avatar_url?: string
      picture?: string
    }
  } | null
  signOut: () => void
  isCollapsed?: boolean
}

export function ProfileSection({ user, signOut, isCollapsed = false }: ProfileSectionProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number; width?: number } | null>(null)

  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name
    if (user?.user_metadata?.name) return user.user_metadata.name
    if (user?.email) return user.email.split('@')[0]
    return 'User'
  }

  const getUserEmail = () => user?.email || 'user@example.com'

  const updatePopupPosition = () => {
    if (!profileRef.current) return
    const rect = profileRef.current.getBoundingClientRect()
    const popupWidth = 192 // min-w-[12rem]
    let left = isCollapsed ? rect.left + rect.width / 2 - popupWidth / 2 : rect.left
    // Clamp so popup is never cut off on the left (or right) of the viewport
    const padding = 12
    left = Math.max(padding, Math.min(left, typeof window !== 'undefined' ? window.innerWidth - popupWidth - padding : left))
    const width = isCollapsed ? undefined : rect.width
    setPopupPosition({ top: rect.top - 8, left, width })
  }

  // Position profile popup in portal (avoids clipping in collapsed mode)
  useLayoutEffect(() => {
    if (!isProfileOpen || !profileRef.current) {
      setPopupPosition(null)
      return
    }
    updatePopupPosition()
  }, [isProfileOpen, isCollapsed])

  useEffect(() => {
    if (!isProfileOpen) return
    const onScrollOrResize = () => updatePopupPosition()
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [isProfileOpen, isCollapsed])

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      const el = target as Element
      const insidePopup = el.closest?.('[data-profile-popup]')
      if (profileRef.current && !profileRef.current.contains(target) && !insidePopup) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className={`shrink-0 border-t border-slate-100 ${isCollapsed ? 'py-2 px-3' : 'px-3 py-2'}`} ref={profileRef}>
      <div className="relative w-full flex justify-center">
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex w-full min-w-0 max-w-full items-center justify-center rounded-lg px-0 py-2 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                <ProfileBubble
                  name={getUserDisplayName()}
                  avatarUrl={(user?.user_metadata?.avatar_url as string | null | undefined) ?? ((user?.user_metadata as Record<string, unknown>)?.picture as string | null | undefined) ?? null}
                  size="default"
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              <p className="font-medium text-slate-900">{getUserDisplayName()}</p>
              <p className="text-xs text-slate-500">{getUserEmail()}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors text-left"
          >
            <ProfileBubble
              name={getUserDisplayName()}
              avatarUrl={(user?.user_metadata?.avatar_url as string | null | undefined) ?? ((user?.user_metadata as Record<string, unknown>)?.picture as string | null | undefined) ?? null}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {getUserDisplayName()}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {getUserEmail()}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
          </button>
        )}

        {/* Profile popup: rendered in portal when open so it is not clipped in collapsed mode */}
        {isProfileOpen && popupPosition && typeof document !== 'undefined' && createPortal(
          <div
            data-profile-popup=""
            className="fixed bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 z-[200]"
            style={{
              top: popupPosition.top,
              left: popupPosition.left,
              width: popupPosition.width,
              minWidth: popupPosition.width ? undefined : '12rem',
              transform: 'translateY(-100%)',
            }}
          >
            <ProfileBubblePopupContent
              name={getUserDisplayName()}
              email={getUserEmail()}
              avatarUrl={(user?.user_metadata?.avatar_url as string | null | undefined) ?? ((user?.user_metadata as Record<string, unknown>)?.picture as string | null | undefined) ?? null}
              footer={
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="mt-2 flex items-center gap-2 w-full px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              }
            />
          </div>,
          document.body
        )}
      </div>
    </div>
  )
}
