export interface ValidationResult {
  file: string
  type: "XML" | "JSON" | "AASX" | "Unsupported" | "Unknown"
  valid: boolean
  errors?: string[]
  warnings?: string[]
  parsed?: any
  processingTime?: number
  thumbnail?: string // Added thumbnail property to store extracted AASX thumbnails
}

export interface FileProcessingState {
  isProcessing: boolean
  progress: number
  currentFile?: string
}

export interface ExtractedFile {
  name: string
  content: string
  size: number
}

export interface AASInfo {
  id: string
  idShort?: string
  assetKind?: string
  assetInformation?: any
  description?: any[]
  administration?: any
  derivedFrom?: any
  embeddedDataSpecifications?: any[]
  submodelRefs?: string[]
  rawData?: any
}

export interface SubmodelInfo {
  idShort: string
  id: string
  kind?: string
  description?: any[]
  administration?: any
  semanticId?: any
  qualifiers?: any[]
  embeddedDataSpecifications?: any[]
  submodelElements?: any[]
  rawData?: any
}

export interface ParsedAASData {
  assetAdministrationShells: AASInfo[]
  submodels: SubmodelInfo[]
  rawData?: any
}

export interface StoredAASXFile {
  id: string
  fileName: string
  validationDate: string
  xmlResult?: ValidationResult
  jsonResult?: ValidationResult
  parsedData?: any // Adjust type as per your parsed data
  serverPackageId?: string // Added serverPackageId back to track server-stored files for deletion
}

export interface AASXStorage {
  files: StoredAASXFile[]
  lastUpdated: string
}
