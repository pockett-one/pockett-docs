/**
 * Rasterize `app/icon.svg` to PNG(s) for static assets (e.g. Google Cloud OAuth consent branding).
 *
 * Usage (from `frontend/`):
 *   node scripts/render-app-icon-png.mjs
 *
 * Requires `sharp` (already present via Next.js / image pipeline).
 */
import sharp from "sharp"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")
const svgPath = path.join(root, "app", "icon.svg")

const svg = await readFile(svgPath)

/** Google OAuth consent screen: square logo, typically 120×120. */
const OAUTH_SIZE = 120

await sharp(svg, { density: 400 })
  .resize(OAUTH_SIZE, OAUTH_SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9 })
  .toFile(path.join(root, "public", "google-oauth-brand-logo.png"))

console.log("Wrote public/google-oauth-brand-logo.png (120×120)")
