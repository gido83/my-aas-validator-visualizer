"use client"

import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface ProgressBarProps {
  progress: number
  className?: string
  showPercentage?: boolean
}

export function ProgressBar({ progress, className, showPercentage = true }: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100)

  return (
    <div className={cn("w-full space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Processing...</span>
        {showPercentage && (
          <span className="text-sm text-gray-600 dark:text-gray-400">{Math.round(clampedProgress)}%</span>
        )}
      </div>
      <Progress value={clampedProgress} className="w-full h-2" />
    </div>
  )
}
