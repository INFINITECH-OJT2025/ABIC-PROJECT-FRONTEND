"use client"

import React from "react"
import { AlertTriangle, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface FormTooltipErrorProps {
  message?: string
  onClose?: () => void
  darkMode?: boolean
}

export default function FormTooltipError({
  message,
  onClose,
  darkMode = false,
}: FormTooltipErrorProps) {

  return (
    <div className="relative mt-2">
      <div className="absolute left-0 right-0 z-10">
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{
                opacity: 0,
                y: 8,
                scale: 0.9,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 8,
                scale: 0.9,
              }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 20,
              }}
              className={cn(
                "relative flex items-start gap-3 shadow-xl rounded-md px-3 py-2 text-sm",
                darkMode
                  ? "bg-gray-800 border border-gray-600 text-gray-200"
                  : "bg-white border border-gray-300 text-gray-800"
              )}
            >
              <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />

              <div className="flex-1">{message}</div>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className={cn(
                    "transition-colors",
                    darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  <X className="h-4 w-4" />
                </button>
              )}


            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}