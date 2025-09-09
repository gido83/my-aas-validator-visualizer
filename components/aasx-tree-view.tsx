"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, FileText, Folder, Database } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { StoredAASXFile } from "@/lib/types"

interface AASXTreeViewProps {
  file: StoredAASXFile
}

interface TreeNode {
  id: string
  name: string
  type: "folder" | "file" | "property"
  children?: TreeNode[]
  value?: any
  expanded?: boolean
}

export function AASXTreeView({ file }: AASXTreeViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["root"]))

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  const buildTreeFromData = (data: any, parentId = "root", parentKey = ""): TreeNode[] => {
    if (!data || typeof data !== "object") {
      return []
    }

    return Object.entries(data)
      .map(([key, value], index) => {
        const nodeId = `${parentId}-${key}-${index}`

        if (key === "conceptDescriptions") {
          return null
        }

        if (Array.isArray(value)) {
          if (value.length === 1) {
            // For single-item arrays, show the content directly without array notation
            const item = value[0]
            if (typeof item === "object" && item !== null) {
              // Show meaningful names for AAS structures
              let displayName = key
              if (key === "assetAdministrationShells" && item.idShort) {
                displayName = `Asset Administration Shell: ${item.idShort}`
              } else if (key === "submodels" && item.idShort) {
                displayName = `Submodel: ${item.idShort}`
              } else if (key === "reference" && item.type) {
                displayName = `${item.type} Reference`
              }

              return {
                id: nodeId,
                name: displayName,
                type: "folder",
                children: buildTreeFromData(item, nodeId, key),
              }
            } else {
              return {
                id: nodeId,
                name: key,
                type: "property",
                value: item,
              }
            }
          } else if (value.length > 1) {
            // For multi-item arrays, show items with meaningful names
            return {
              id: nodeId,
              name: `${key} (${value.length} items)`,
              type: "folder",
              children: value.map((item, itemIndex) => {
                let itemName = `Item ${itemIndex + 1}`

                // Show meaningful names for AAS array items
                if (typeof item === "object" && item !== null) {
                  if (item.idShort) {
                    itemName = item.idShort
                  } else if (item.type && key === "keys") {
                    itemName = `${item.type} Key`
                  } else if (item.type) {
                    itemName = item.type
                  }
                }

                return {
                  id: `${nodeId}-${itemIndex}`,
                  name: itemName,
                  type: typeof item === "object" ? "folder" : "property",
                  children:
                    typeof item === "object" ? buildTreeFromData(item, `${nodeId}-${itemIndex}`, key) : undefined,
                  value: typeof item !== "object" ? item : undefined,
                }
              }),
            }
          } else {
            // Empty array
            return {
              id: nodeId,
              name: `${key} (empty)`,
              type: "property",
              value: "[]",
            }
          }
        } else if (value && typeof value === "object") {
          let displayName = key
          if (key === "assetInformation") {
            displayName = "Asset Information"
          } else if (key === "submodelElements") {
            displayName = "Submodel Elements"
          }

          return {
            id: nodeId,
            name: displayName,
            type: "folder",
            children: buildTreeFromData(value, nodeId, key),
          }
        } else {
          return {
            id: nodeId,
            name: key,
            type: "property",
            value: value,
          }
        }
      })
      .filter(Boolean) // Filter out null values from skipped concept descriptions
  }

  const renderNode = (node: TreeNode, depth = 0) => {
    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = node.children && node.children.length > 0

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-2 py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer`}
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
          onClick={() => hasChildren && toggleNode(node.id)}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )
          ) : (
            <div className="w-4 h-4" />
          )}

          {node.type === "folder" ? (
            node.name.includes("Asset Administration Shell") ? (
              <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            ) : node.name.includes("Submodel") ? (
              <Folder className="w-4 h-4 text-green-600 dark:text-green-400" />
            ) : (
              <Folder className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            )
          ) : (
            <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          )}

          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{node.name}</span>

          {node.value !== undefined && (
            <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
              = {typeof node.value === "string" ? `"${node.value}"` : String(node.value)}
            </span>
          )}
        </div>

        {hasChildren && isExpanded && <div>{node.children!.map((child) => renderNode(child, depth + 1))}</div>}
      </div>
    )
  }

  const treeData = buildTreeFromData(file.parsedData)

  return (
    <div className="space-y-4">
      {/* File Info Header */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{file.fileName}</h3>
        </div>

        <div className="flex flex-wrap gap-2 mb-2">
          <Badge variant={file.xmlResult?.valid ? "default" : "destructive"}>
            XML: {file.xmlResult?.valid ? "Valid" : "Invalid"}
          </Badge>
          <Badge variant={file.jsonResult?.valid ? "default" : "destructive"}>
            JSON: {file.jsonResult?.valid ? "Valid" : "Invalid"}
          </Badge>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          Validated: {new Date(file.validationDate).toLocaleString()}
        </p>
      </div>

      {/* Tree Structure */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">AASX Structure</h4>
        </div>

        <div className="p-2 max-h-96 overflow-y-auto">
          {treeData.length > 0 ? (
            treeData.map((node) => renderNode(node))
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No structure data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
