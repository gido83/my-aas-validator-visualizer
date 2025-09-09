"use client"

import { CheckCircle, XCircle, AlertTriangle, FileText, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useState } from "react"
import type { ValidationResult } from "@/lib/types"

interface ValidationResultsProps {
  results: ValidationResult[]
}

export function ValidationResults({ results }: ValidationResultsProps) {
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set())

  const toggleExpanded = (resultId: string) => {
    const newExpanded = new Set(expandedResults)
    if (newExpanded.has(resultId)) {
      newExpanded.delete(resultId)
    } else {
      newExpanded.add(resultId)
    }
    setExpandedResults(newExpanded)
  }

  if (results.length === 0) {
    return null
  }

  const getStatusIcon = (valid: boolean) => {
    return valid ? (
      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
    ) : (
      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
    )
  }

  const getStatusColor = (valid: boolean) => {
    return valid ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"
  }

  const getBadgeVariant = (valid: boolean) => {
    return valid ? "default" : "destructive"
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Validation Results</h2>
      </div>

      {results.map((result, index) => {
        const resultId = `${result.type}-${index}`
        const isExpanded = expandedResults.has(resultId)
        const hasDetails =
          (result.errors && result.errors.length > 0) || (result.warnings && result.warnings.length > 0)

        return (
          <Card key={resultId} className="w-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(result.valid)}
                  <div>
                    <CardTitle className="text-lg">{result.type} Validation</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">File: {result.file}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {result.processingTime && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{result.processingTime}ms</span>
                    </div>
                  )}
                  <Badge variant={getBadgeVariant(result.valid)}>{result.valid ? "Valid" : "Invalid"}</Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className={`font-medium ${getStatusColor(result.valid)} mb-3`}>
                {result.valid ? (
                  <span>✓ Schema validation passed successfully</span>
                ) : (
                  <span>✗ Schema validation failed</span>
                )}
              </div>

              {hasDetails && (
                <Collapsible>
                  <CollapsibleTrigger
                    onClick={() => toggleExpanded(resultId)}
                    className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    <span>{isExpanded ? "Hide" : "Show"} Details</span>
                    <div className={`transform transition-transform ${isExpanded ? "rotate-90" : ""}`}>▶</div>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="mt-3">
                    {result.errors && result.errors.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                          <h4 className="font-medium text-red-700 dark:text-red-300">
                            Errors ({result.errors.length})
                          </h4>
                        </div>
                        <div className="space-y-2">
                          {result.errors.map((error, errorIndex) => (
                            <div
                              key={errorIndex}
                              className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md"
                            >
                              <p className="text-sm text-red-800 dark:text-red-200 font-mono">{error}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.warnings && result.warnings.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                          <h4 className="font-medium text-yellow-700 dark:text-yellow-300">
                            Warnings ({result.warnings.length})
                          </h4>
                        </div>
                        <div className="space-y-2">
                          {result.warnings.map((warning, warningIndex) => (
                            <div
                              key={warningIndex}
                              className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md"
                            >
                              <p className="text-sm text-yellow-800 dark:text-yellow-200 font-mono">{warning}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
