"use client"

import type React from "react"

import { useCallback, useState } from "react"
import { Upload, FileText, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileDropZoneProps {
  onFileSelect: (file: File) => void
  isProcessing: boolean
  className?: string
}

export function FileDropZone({ onFileSelect, isProcessing, className }: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!isProcessing) {
        setIsDragOver(true)
      }
    },
    [isProcessing],
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)

      if (isProcessing) return

      const files = Array.from(e.dataTransfer.files)
      const file = files[0]

      if (file) {
        validateAndSelectFile(file)
      }
    },
    [isProcessing],
  )

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      validateAndSelectFile(file)
    }
    // Reset input value to allow selecting the same file again
    e.target.value = ""
  }, [])

  const validateAndSelectFile = (file: File) => {
    const validExtensions = [".aasx", ".xml", ".json"]
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."))

    if (!validExtensions.includes(fileExtension)) {
      alert(`Invalid file type. Please select an AASX, XML, or JSON file.`)
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      // 50MB limit
      alert(`File too large. Please select a file smaller than 50MB.`)
      return
    }

    onFileSelect(file)
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200",
          isDragOver && !isProcessing
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
          isProcessing && "opacity-50 cursor-not-allowed",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".aasx,.xml,.json"
          onChange={handleFileInput}
          disabled={isProcessing}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <div className="flex flex-col items-center gap-4">
          {isProcessing ? (
            <div className="w-12 h-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          ) : (
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
              <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {isProcessing ? "Processing..." : "Drop your AASX file here"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {isProcessing ? "Please wait while we validate your file" : "or click to browse and select a file"}
            </p>

            <div className="flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                <span>AASX</span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                <span>XML</span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                <span>JSON</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
          <AlertCircle className="w-3 h-3" />
          <span>Maximum file size: 50MB</span>
        </div>
      </div>
    </div>
  )
}
