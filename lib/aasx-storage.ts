import type { StoredAASXFile, ValidationResult } from "./types"
import { deleteAASX } from "./aasxApi"

const STORAGE_KEY = "valid-aasx-files"

export function saveValidAASX(
  fileName: string,
  xmlResult?: ValidationResult,
  jsonResult?: ValidationResult,
  originalFile?: File,
  serverPackageId?: string,
): void {
  if (!xmlResult?.valid || !jsonResult?.valid) {
    console.log("Skipping save: validation failed")
    return
  }

  const existingFiles = getStoredAASXFiles()
  if (existingFiles.some((file) => file.fileName === fileName)) {
    console.log(`Skipping save: ${fileName} already exists in storage.`)
    return
  }

  const storedFile: StoredAASXFile = {
    id: `${fileName}-${Date.now()}`,
    fileName,
    validationDate: new Date().toISOString(),
    xmlResult,
    jsonResult,
    parsedData: xmlResult?.parsed || jsonResult?.parsed,
    serverPackageId,
  }

  const updatedFiles = [...existingFiles, storedFile]

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        files: updatedFiles,
        lastUpdated: new Date().toISOString(),
      }),
    )
    console.log("Successfully saved to local storage")
  } catch (error) {
    console.error("Failed to save AASX file to localStorage:", error)
  }
}

export function getStoredAASXFiles(): StoredAASXFile[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const data = JSON.parse(stored)
    return data.files || []
  } catch (error) {
    console.error("Failed to load stored AASX files:", error)
    return []
  }
}

export async function removeStoredAASX(id: string): Promise<void> {
  console.log(`[v0] Starting delete process for: ${id}`)

  const existingFiles = getStoredAASXFiles()
  const fileToRemove = existingFiles.find((file) => file.id === id)

  if (!fileToRemove) {
    console.warn(`File with id ${id} not found in storage`)
    return
  }

  console.log(`Found file to remove:`, {
    fileName: fileToRemove.fileName,
    serverPackageId: fileToRemove.serverPackageId,
  })

  // Delete from server if serverPackageId exists
  if (fileToRemove.serverPackageId !== null && fileToRemove.serverPackageId !== undefined) {
    try {
      console.log(`[v0] Attempting to delete from server with packageId: ${fileToRemove.serverPackageId}`)
      await deleteAASX(fileToRemove.serverPackageId)
      console.log(`[v0] Successfully deleted from server`)
    } catch (error) {
      console.error(`[v0] Failed to delete from server:`, error)
      // Continue with local deletion even if server deletion fails
    }
  } else {
    console.log(`[v0] No serverPackageId found, skipping server deletion`)
  }

  // Remove from local storage
  const updatedFiles = existingFiles.filter((file) => file.id !== id)

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        files: updatedFiles,
        lastUpdated: new Date().toISOString(),
      }),
    )
    console.log(`[v0] Successfully removed from local storage`)
  } catch (error) {
    console.error("Failed to remove AASX file from localStorage:", error)
    throw error
  }

  console.log(`[v0] Delete completed successfully`)
}

export function clearStoredAASX(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error("Failed to clear stored AASX files:", error)
  }
}
