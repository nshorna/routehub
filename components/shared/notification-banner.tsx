"use client"

import { AlertCircle, CheckCircle, XCircle, Info } from "lucide-react"
import { useEffect, useState } from "react"

export type NotificationType = "success" | "error" | "info" | "warning"

interface NotificationBannerProps {
  message: string
  type: NotificationType
  duration?: number
  onClose?: () => void
}

export function NotificationBanner({ message, type, duration = 4000, onClose }: NotificationBannerProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onClose?.()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  if (!isVisible) return null

  const colorStyles = {
    success: "bg-primary text-primary-foreground",
    error: "bg-destructive text-destructive-foreground",
    warning: "bg-accent text-accent-foreground",
    info: "bg-secondary text-secondary-foreground",
  }

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  }

  return (
    <div
      className={`fixed top-4 right-4 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg z-50 ${colorStyles[type]}`}
    >
      {icons[type]}
      <span className="text-sm font-medium">{message}</span>
    </div>
  )
}
