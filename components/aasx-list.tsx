"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Calendar, FileText } from "lucide-react"
import { getStoredAASXFiles, removeStoredAASX } from "@/lib/aasx-storage"
import type { StoredAASXFile } from "@/lib/types"

interface AASXListProps {
  onFileSelect: (file: StoredAASXFile) => void
  selectedFile: StoredAASXFile | null
}

export function AASXList({ onFileSelect, selectedFile }: AASXListProps) {
  const [files, setFiles] = useState<StoredAASXFile[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadFiles = () => {
    const storedFiles = getStoredAASXFiles()
    setFiles(storedFiles)
  }

  const getAASCounts = (parsedData: any) => {
    let aasCount = 0
    let submodelCount = 0

    if (parsedData && typeof parsedData === "object") {
      // Count Asset Administration Shells
      if (parsedData.assetAdministrationShells) {
        aasCount = Array.isArray(parsedData.assetAdministrationShells) ? parsedData.assetAdministrationShells.length : 1
      }

      if (parsedData.submodels) {
        // Look for submodel array within submodels
        if (Array.isArray(parsedData.submodels)) {
          // If submodels is an array, count all submodel items within it
          submodelCount = parsedData.submodels.reduce((count: number, item: any) => {
            if (item && typeof item === "object") {
              // Look for submodel property that contains the actual submodels
              if (item.submodel && Array.isArray(item.submodel)) {
                return count + item.submodel.length
              }
              // If the item itself is a submodel, count it
              if (item.idShort || item.id) {
                return count + 1
              }
            }
            return count
          }, 0)
        } else if (parsedData.submodels.submodel && Array.isArray(parsedData.submodels.submodel)) {
          // Handle case where submodels contains a submodel array
          submodelCount = parsedData.submodels.submodel.length
        } else {
          submodelCount = 1
        }
      }
    }

    return { aasCount, submodelCount }
  }

  useEffect(() => {
    loadFiles()
  }, [])

  const handleDelete = async (file: StoredAASXFile, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent file selection when clicking delete

    if (!confirm(`Are you sure you want to delete "${file.fileName}"?`)) {
      return
    }

    setDeletingId(file.id)

    try {
      console.log("[v0] Starting delete process for:", file.fileName)
      await removeStoredAASX(file.id)
      console.log("[v0] Delete completed successfully")

      // Reload the files list
      loadFiles()

      // Clear selection if the deleted file was selected
      if (selectedFile?.id === file.id) {
        onFileSelect(null as any)
      }
    } catch (error) {
      console.error("[v0] Delete failed:", error)
      alert(`Failed to delete file: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 p-8">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No AASX files stored</p>
          <p className="text-sm">Upload and validate AASX files to see them here</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {files.length} file{files.length !== 1 ? "s" : ""}
        </p>
        <Button variant="outline" size="sm" onClick={loadFiles} className="text-xs bg-transparent">
          Refresh
        </Button>
      </div>

      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className={`
              p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md
              ${
                selectedFile?.id === file.id
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }
            `}
            onClick={() => onFileSelect(file)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {file.xmlResult?.thumbnail || file.jsonResult?.thumbnail ? (
                  <img
                    src={file.xmlResult?.thumbnail || file.jsonResult?.thumbnail}
                    alt="AASX Thumbnail"
                    className="w-12 h-12 object-cover rounded border flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded border flex-shrink-0 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-gray-400" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">{file.fileName}</h4>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      XML: {file.xmlResult?.valid ? "✓" : "✗"}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      JSON: {file.jsonResult?.valid ? "✓" : "✗"}
                    </Badge>
                    {(() => {
                      const { aasCount, submodelCount } = getAASCounts(file.parsedData)
                      return (
                        <>
                          {aasCount > 0 && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              AAS {aasCount}
                            </Badge>
                          )}
                          {submodelCount > 0 && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              SM {submodelCount}
                            </Badge>
                          )}
                        </>
                      )
                    })()}
                  </div>

                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="w-3 h-3" />
                    {formatDate(file.validationDate)}
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleDelete(file, e)}
                disabled={deletingId === file.id}
                className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
              >
                {deletingId === file.id ? (
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
