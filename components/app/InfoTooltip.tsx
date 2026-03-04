"use client"

import React from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface InfoTooltipProps {
    /** The text to display inside the tooltip (if any). If omitted, children is used as info. */
    text?: React.ReactNode
    /** The content that triggers the tooltip on hover */
    children: React.ReactNode
    /** Custom classes for the tooltip content box */
    contentClassName?: string
    /** Delay before tooltip shows (ms) */
    delayDuration?: number
    /** Side to display the tooltip */
    side?: "top" | "right" | "bottom" | "left"
    /** Alignment of the tooltip */
    align?: "start" | "center" | "end"
    /** Maximum width of the tooltip in pixels */
    maxWidth?: number
}

export default function InfoTooltip({
    text,
    children,
    contentClassName,
    delayDuration = 200,
    side = "top",
    align = "center",
    maxWidth = 250
}: InfoTooltipProps) {
    const tooltipContent = text ?? children

    // Only render tooltip if there's actual text
    if (!tooltipContent) {
        return <>{children}</>
    }

    return (
        <TooltipProvider delayDuration={delayDuration}>
            <Tooltip>
                <TooltipTrigger asChild>
                    {children}
                </TooltipTrigger>
                <TooltipContent
                    side={side}
                    align={align}
                    hideArrow={true}
                    sideOffset={2}
                    style={{ maxWidth }}
                    className={cn(
                        "z-50 bg-white border border-gray-200 text-gray-800 shadow-xl rounded-md px-3 py-2 text-sm text-left whitespace-normal break-words",
                        contentClassName
                    )}
                >
                    {tooltipContent}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
