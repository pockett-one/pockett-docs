#!/usr/bin/env node
/**
 * Updates `data/roadmap.json` git metadata and per-bar `lastProgressCommitIso`
 * from `git log` (last commit touching each bar's `gitPaths`).
 *
 * Run from repo root or `frontend/`. Intended for commits on `dev` (see .cursor/rules).
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function findGitRoot(startDir) {
    let dir = resolve(startDir)
    for (;;) {
        if (existsSync(join(dir, '.git'))) return dir
        const parent = dirname(dir)
        if (parent === dir) return null
        dir = parent
    }
}

function git(gitRoot, args) {
    try {
        return execFileSync('git', args, {
            cwd: gitRoot,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
        }).trim()
    } catch {
        return ''
    }
}

function main() {
    const frontendDir = resolve(__dirname, '..')
    const gitRoot = findGitRoot(frontendDir)
    if (!gitRoot) {
        console.warn('sync-roadmap-git: no .git found; skipping.')
        process.exit(0)
    }

    const dataPath = join(frontendDir, 'data', 'roadmap.json')
    const raw = readFileSync(dataPath, 'utf8')
    const data = JSON.parse(raw)

    const branch = git(gitRoot, ['rev-parse', '--abbrev-ref', 'HEAD'])
    const headShort = git(gitRoot, ['rev-parse', '--short', 'HEAD'])
    const relData = relative(gitRoot, dataPath).replace(/\\/g, '/')
    const dataFileLastCommitIso = git(gitRoot, ['log', '-1', '--format=%cI', '--', relData])

    data.git = {
        recordedAt: new Date().toISOString(),
        branch: branch || null,
        headShort: headShort || null,
        dataFileLastCommitIso: dataFileLastCommitIso || null,
    }

    for (const bar of data.bars) {
        delete bar.lastProgressCommitIso
        const paths = Array.isArray(bar.gitPaths) ? bar.gitPaths.filter(Boolean) : []
        if (paths.length === 0) continue
        const iso = git(gitRoot, ['log', '-1', '--format=%cI', '--', ...paths])
        if (iso) bar.lastProgressCommitIso = iso
    }

    writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n', 'utf8')
    console.log('sync-roadmap-git: updated', relData, branch ? `(${branch} ${headShort})` : '')
}

main()
