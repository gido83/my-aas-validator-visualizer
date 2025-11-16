"use client"
import { useState } from "react"
import { FileDropZone } from "@/components/file-drop-zone"
import { ValidationResults } from "@/components/validation-results"
import { ProgressBar } from "@/components/progress-bar"
import { AASXList } from "@/components/aasx-list"
import { AASXTreeView } from "@/components/aasx-tree-view"
import { Button } from "@/components/ui/button"
import { processFile } from "@/lib/file-processor"
import type { ValidationResult, FileProcessingState, StoredAASXFile } from "@/lib/types"
import { Shield, ExternalLink, Upload, Database, ArrowLeft } from "lucide-react"
import { saveValidAASX } from "@/lib/aasx-storage"
import { createAASX } from "@/lib/aasxApi"

type ViewMode = "validator" | "list" | "tree"

export default function AASXValidatorPage() {
  const [results, setResults] = useState<ValidationResult[]>([])
  const [processingState, setProcessingState] = useState<FileProcessingState>({
    isProcessing: false,
    progress: 0,
  })
  const [viewMode, setViewMode] = useState<ViewMode>("validator")
  const [selectedFile, setSelectedFile] = useState<StoredAASXFile | null>(null)

  const handleFileSelect = async (file: File) => {
    setResults([])
    setProcessingState({
      isProcessing: true,
      progress: 0,
      currentFile: file.name,
    })

    try {
      console.log("[v0] Starting file processing for:", file.name)
      const validationResults = await processFile(file, (progress) => {
        setProcessingState((prev) => ({ ...prev, progress }))
      })

      const xmlResult = validationResults.find((r) => r.type === "XML")
      const jsonResult = validationResults.find((r) => r.type === "JSON")

      if (xmlResult?.valid && jsonResult?.valid) {
        console.log("[v0] Both XML and JSON valid, saving to local storage...")

        let serverPackageId: string | undefined

        try {
          console.log("[v0] Uploading to server...")
          const serverResponse = await createAASX(file)
          serverPackageId = serverResponse?.toString()
          console.log("[v0] Server upload successful:", serverResponse)
        } catch (serverError) {
          console.warn("[v0] Server upload failed:", serverError)
          // Continue with local storage even if server upload fails
        }

        saveValidAASX(file.name, xmlResult, jsonResult, file, serverPackageId)
        console.log("[v0] AASX saved to local storage successfully")
      } else {
        console.log("[v0] Skipping storage: Both XML and JSON must be valid.")
      }

      setResults(validationResults.filter((r) => r.type === "XML" || r.type === "JSON"))
    } catch (error) {
      console.error("[v0] File processing error:", error)
      setResults([
        {
          file: file.name,
          type: "Unknown",
          valid: false,
          errors: ["An unexpected error occurred while processing the file"],
        },
      ])
    } finally {
      setProcessingState({
        isProcessing: false,
        progress: 0,
      })
    }
  }

  const handleFileFromList = (file: StoredAASXFile) => {
    setSelectedFile(file)
    setViewMode("tree")
  }

  const handleBackToList = () => {
    setSelectedFile(null)
    setViewMode("list")
  }

  const handleBackToValidator = () => {
    setViewMode("validator")
    setSelectedFile(null)
  }

  return (
    <div className="min-h-screen bg-gray-250 dark:bg-gray-900">
      <div className="max-w-8xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary rounded-full shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-primary dark:text-blue-400">
              AASX Validator
            </h1>
          </div>
          <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto text-balance">
            Validate Asset Administration Shell (AAS) files against official schemas. Supports .aasx archives, XML, and
            JSON formats.
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-600 dark:text-gray-400">
            <a
              href="https://admin-shell.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              AAS Specification
            </a>
            <span>•</span>
            <span>Schema Version 3.1</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mb-8">
          <Button
            variant={viewMode === "validator" ? "default" : "outline"}
            onClick={() => setViewMode("validator")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              viewMode === "validator"
                ? "bg-primary hover:bg-primary/90 text-white shadow-lg"
                : "border-primary/20 text-primary hover:bg-primary/5 dark:border-primary/50 dark:text-primary dark:hover:bg-primary/10"
            }`}
          >
            <Upload className="w-4 h-4" />
            Validator
          </Button>
          <Button
            variant={viewMode === "list" || viewMode === "tree" ? "default" : "outline"}
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              viewMode === "list" || viewMode === "tree"
                ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                : "border-primary/20 text-primary hover:bg-primary/5 dark:border-primary/50 dark:text-primary dark:hover:bg-primary/10"
            }`}
          >
            <Database className="w-4 h-4" />
            Visualizer
          </Button>
        </div>

        {viewMode === "validator" && (
          <>
            {/* File Drop Zone */}
            <FileDropZone
              onFileSelect={handleFileSelect}
              isProcessing={processingState.isProcessing}
              className="mb-8"
            />

            {/* Progress Bar */}
            {processingState.isProcessing && (
              <div className="mb-8">
                <ProgressBar progress={processingState.progress} />
                {processingState.currentFile && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
                    Processing: {processingState.currentFile}
                  </p>
                )}
              </div>
            )}

            {/* Results */}
            <ValidationResults results={results} />
          </>
        )}

        {viewMode === "list" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-primary/20 dark:border-gray-700 overflow-hidden shadow-lg">
              <div className="p-4 bg-primary text-primary-foreground">
                <h3 className="font-semibold">Stored AASX Models</h3>
              </div>
              <div className="overflow-y-auto h-full">
                <AASXList onFileSelect={setSelectedFile} selectedFile={selectedFile} />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-primary/20 dark:border-gray-700 overflow-hidden shadow-lg">
              <div className="p-4 bg-primary text-primary-foreground">
                <h3 className="font-semibold">
                  {selectedFile ? selectedFile.fileName : "Select a file to view details"}
                </h3>
              </div>
              <div className="overflow-y-auto h-full p-4">
                {selectedFile ? (
                  <AASXTreeView file={selectedFile} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    <div className="text-center">
                      <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Click on an AASX file to view its structure</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {viewMode === "tree" && selectedFile && (
          <>
            <div className="mb-4">
              <Button
                variant="outline"
                onClick={handleBackToList}
                className="flex items-center gap-2 border-primary/20 text-primary hover:bg-primary/5 dark:border-primary/50 dark:text-primary dark:hover:bg-primary/10 bg-transparent"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to List
              </Button>
            </div>
            <AASXTreeView file={selectedFile} />
          </>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-primary/20 dark:border-gray-700 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Built for validating Asset Administration Shell files according to the official specifications.</p>
        </footer>
      </div>
    </div>
  )
}