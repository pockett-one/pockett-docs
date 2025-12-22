import fs from 'fs'
import path from 'path'

export class IgnoreParser {
    private static instance: IgnoreParser
    private ignorePatterns: string[] = []
    private lastLoaded: number = 0
    private readonly CACHE_TTL = 60 * 1000 // 1 minute cache

    private constructor() { }

    public static getInstance(): IgnoreParser {
        if (!IgnoreParser.instance) {
            IgnoreParser.instance = new IgnoreParser()
        }
        return IgnoreParser.instance
    }

    private loadPatterns() {
        // Reload if cache expired or not loaded
        if (Date.now() - this.lastLoaded < this.CACHE_TTL && this.ignorePatterns.length > 0) {
            return
        }

        try {
            const ignorePath = path.join(process.cwd(), '.pockettignore')
            if (fs.existsSync(ignorePath)) {
                const content = fs.readFileSync(ignorePath, 'utf-8')
                this.ignorePatterns = content
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line && !line.startsWith('#')) // Filter empty and comments

                this.lastLoaded = Date.now()
                console.log('Loaded .pockettignore patterns:', this.ignorePatterns)
            } else {
                this.ignorePatterns = []
            }
        } catch (error) {
            console.error('Failed to load .pockettignore:', error)
            this.ignorePatterns = []
        }
    }

    public getGoogleDriveQueryClause(): string {
        this.loadPatterns()

        if (this.ignorePatterns.length === 0) {
            return ''
        }

        // Generate query to exclude files by exact name
        // clause format: "and not name = 'Pattern1' and not name = 'Pattern2'"
        const clauses = this.ignorePatterns.map(pattern => `not name = '${pattern}'`)
        return `and ${clauses.join(' and ')}`
    }

    public getPatterns(): string[] {
        this.loadPatterns()
        return [...this.ignorePatterns]
    }
}

export const ignoreParser = IgnoreParser.getInstance()
