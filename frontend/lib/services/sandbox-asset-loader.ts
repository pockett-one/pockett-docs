/**
 * Load sandbox sample assets from lib/services/sandbox-assets (backend only, not in public).
 * Used when creating the sandbox workspace; assets are read from disk and uploaded to Drive.
 */
import { readFileSync, existsSync } from 'fs'
import path from 'path'

const ASSET_DIR = 'sandbox-assets'

/** Extension -> asset filename. One sample per type; same content used for all files of that type. */
const EXT_TO_ASSET: Record<string, string> = {
  png: 'sample.png',
  jpg: 'sample.jpg',
  jpeg: 'sample.jpg',
  gif: 'sample.gif',
  webp: 'sample.webp',
  docx: 'sample.docx',
  xlsx: 'sample.xlsx',
  pptx: 'sample.pptx',
  pdf: 'sample.pdf',
  zip: 'sample.zip',
}

function getAssetsDir(): string {
  // In Next.js API/server, cwd is usually the app root (e.g. frontend/)
  const cwd = process.cwd()
  return path.join(cwd, 'lib', 'services', ASSET_DIR)
}

/**
 * Return the Buffer for a sandbox asset by file extension (e.g. 'png', 'jpg').
 * Returns null if the asset file does not exist.
 */
export function getSandboxAssetBuffer(extension: string): Buffer | null {
  const assetFile = EXT_TO_ASSET[extension?.toLowerCase()]
  if (!assetFile) return null
  const dir = getAssetsDir()
  const filePath = path.join(dir, assetFile)
  if (!existsSync(filePath)) return null
  try {
    return readFileSync(filePath)
  } catch {
    return null
  }
}

/** Types that are binary-only (no fallback content). If asset missing, file is skipped. */
const BINARY_ONLY_TYPES = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'zip'])

/**
 * Whether the given sample file type can be loaded from sandbox-assets (images + Office docs).
 */
export function isAssetType(type: string): boolean {
  return type?.toLowerCase() in EXT_TO_ASSET
}

/**
 * True if this type has no text fallback (e.g. image). When asset is missing we skip the file.
 */
export function isBinaryOnlyAssetType(type: string): boolean {
  return BINARY_ONLY_TYPES.has(type?.toLowerCase())
}
