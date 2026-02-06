#!/usr/bin/env node

/**
 * Migration script to replace console.log statements with logger
 * 
 * Usage:
 *   node migrate-to-logger.js <file-path>
 * 
 * This script will:
 * 1. Add logger import if not present
 * 2. Replace console.log with logger.debug or logger.info
 * 3. Replace console.warn with logger.warn
 * 4. Replace console.error with logger.error
 */

const fs = require('fs')
const path = require('path')

function migrateFile(filePath) {
    console.log(`\n📝 Migrating: ${filePath}`)

    let content = fs.readFileSync(filePath, 'utf8')
    let modified = false

    // Check if logger is already imported
    const hasLoggerImport = content.includes("import { logger } from")

    // Add logger import if not present
    if (!hasLoggerImport && (content.includes('console.log') || content.includes('console.error') || content.includes('console.warn'))) {
        // Find the last import statement
        const importRegex = /^import .+ from .+$/gm
        const imports = content.match(importRegex)

        if (imports && imports.length > 0) {
            const lastImport = imports[imports.length - 1]
            const lastImportIndex = content.lastIndexOf(lastImport)
            const insertPosition = lastImportIndex + lastImport.length

            content = content.slice(0, insertPosition) +
                "\nimport { logger } from '@/lib/logger'" +
                content.slice(insertPosition)

            modified = true
            console.log('  ✅ Added logger import')
        }
    }

    // Replace console.log with logger.debug
    const logMatches = content.match(/console\.log\(/g)
    if (logMatches) {
        content = content.replace(/console\.log\(/g, 'logger.debug(')
        modified = true
        console.log(`  ✅ Replaced ${logMatches.length} console.log statements`)
    }

    // Replace console.warn with logger.warn
    const warnMatches = content.match(/console\.warn\(/g)
    if (warnMatches) {
        content = content.replace(/console\.warn\(/g, 'logger.warn(')
        modified = true
        console.log(`  ✅ Replaced ${warnMatches.length} console.warn statements`)
    }

    // Replace console.error with logger.error
    const errorMatches = content.match(/console\.error\(/g)
    if (errorMatches) {
        content = content.replace(/console\.error\(/g, 'logger.error(')
        modified = true
        console.log(`  ✅ Replaced ${errorMatches.length} console.error statements`)
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8')
        console.log('  💾 File saved')
    } else {
        console.log('  ⏭️  No changes needed')
    }
}

// Get file path from command line arguments
const filePath = process.argv[2]

if (!filePath) {
    console.error('❌ Please provide a file path')
    console.log('Usage: node migrate-to-logger.js <file-path>')
    process.exit(1)
}

if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`)
    process.exit(1)
}

migrateFile(filePath)
console.log('\n✅ Migration complete!')
