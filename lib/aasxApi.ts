// src/lib/aasxApi.ts

// Encode to UTF8-BASE64-URL without padding
function encodePackageId(id: string): string {
  if (!id || typeof id !== "string") {
    throw new Error(`Invalid packageId: ${id}. Must be a non-empty string.`)
  }

  // Convert to string if it's a number, then validate it's numeric
  const idStr = id.toString().trim()
  if (!/^\d+$/.test(idStr)) {
    throw new Error(`Invalid packageId: ${idStr}. Must be numeric.`)
  }

  try {
    const utf8Bytes = new TextEncoder().encode(idStr)
    const base64 = btoa(String.fromCharCode(...utf8Bytes))
    // URL-safe base64: replace + with -, / with _, and remove padding
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
  } catch (error) {
    throw new Error(`Failed to encode packageId: ${error}`)
  }
}

const FALLBACK_URLS = [
  process.env.NEXT_PUBLIC_AASX_API_URL || "http://localhost:5001",
]

async function findWorkingApiUrl(): Promise<string> {
  for (const url of FALLBACK_URLS) {
    try {
      console.log(`[v0] Testing API connectivity to: ${url}`)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout for health check

      const response = await fetch(`${url}/workflowMangr/health`, {
        method: "GET",
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        console.log(`[v0] Found working API at: ${url}`)
        return url
      }
    } catch (error) {
      console.log(`[v0] API not reachable at: ${url}`)
      continue
    }
  }

  throw new Error(
    `Cannot reach AASX server at any of these URLs: ${FALLBACK_URLS.join(", ")}. Please ensure your container is running and ports are properly mapped.`,
  )
}

export async function createAASX(file: File): Promise<any> {
  const formData = new FormData()
  formData.append("file", file)

  let apiUrl: string
  try {
    apiUrl = await findWorkingApiUrl()
  } catch (error) {
    console.error("[v0] No working API found:", error.message)
    throw error
  }

  console.log("[v0] Using API URL:", `${apiUrl}/workflowMangr/package`)

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    const response = await fetch(`${apiUrl}/workflowMangr/package`, {
      method: "POST",
      headers: {
        Accept: "*/*",
      },
      body: formData,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    console.log("[v0] Upload response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Upload failed with response:", errorText)
      throw new Error(`Upload failed with status: ${response.status}. ${errorText}`)
    }

    const data = await response.json()
    console.log("[v0] Create response:", data)
    return data
  } catch (error) {
    if (error.name === "AbortError") {
      console.error("[v0] Upload timeout - server may be down")
      throw new Error("Upload timeout - please check if the AASX server is running on " + apiUrl)
    }

    if (error.message.includes("Failed to fetch")) {
      console.error("[v0] Network error - server may be unreachable")
      throw new Error(
        `Cannot connect to AASX server at ${apiUrl}. Please check your container port mapping and ensure the server is running.`,
      )
    }

    console.error("[v0] POST Create AASX error:", error)
    throw error
  }
}

export async function deleteAASX(packageId: string): Promise<void> {
  console.log(`[v0] Attempting to delete packageId: "${packageId}"`)

  if (!packageId) {
    throw new Error("PackageId is required for deletion")
  }

  let apiUrl: string
  try {
    apiUrl = await findWorkingApiUrl()
  } catch (error) {
    console.error("[v0] No working API found for delete:", error.message)
    throw error
  }

  try {
    const encodedId = encodePackageId(packageId)
    console.log(`[v0] Original ID: "${packageId}" -> Encoded ID: "${encodedId}"`)

    const url = `{url}/workflowMangr/package/${encodedId}`
    console.log(`[v0] DELETE URL: ${url}`)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    console.log(`[v0] DELETE response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[v0] DELETE failed. Status: ${response.status}, Response: ${errorText}`)
      throw new Error(`Delete failed with status: ${response.status}. ${errorText}`)
    }

    console.log("[v0] Successfully deleted from server")
  } catch (error) {
    if (error.name === "AbortError") {
      console.error("[v0] Delete timeout - server may be down")
      throw new Error("Delete timeout - please check if the AASX server is running")
    }

    if (error.message.includes("Failed to fetch")) {
      console.error("[v0] Network error during delete - server may be unreachable")
      throw new Error(
        `Cannot connect to AASX server at ${apiUrl} for deletion. Please check your container port mapping.`,
      )
    }

    console.error("[v0] DELETE AASX error:", error)
    throw error
  }
}
