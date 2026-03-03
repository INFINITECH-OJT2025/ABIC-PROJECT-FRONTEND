"use client"

import React from "react"
import { Inbox } from "lucide-react"

export interface EmptyStateProps {
  title?: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({
  title = "Nothing here yet",
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl bg-gray-50/80 border-2 border-dashed border-gray-200">
      
      {/* Fixed Empty Icon */}
      <div className="w-16 h-16 rounded-2xl bg-[#7B0F2B]/10 flex items-center justify-center mb-4">
        <Inbox className="w-8 h-8 text-[#7B0F2B]" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-gray-500 text-center max-w-md mb-6">
          {description}
        </p>
      )}

      {action}
    </div>
  )
}