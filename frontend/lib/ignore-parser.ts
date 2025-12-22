import fs from 'fs'
import path from 'path'

export class IgnoreParser {
    private static instance: IgnoreParser
    private ignorePatterns: string[] = []
    private lastLoaded: number = 0
    private readonly CACHE_TTL = 60 * 1000 // 1 minute cache for file reading

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
            } else {
                this.ignorePatterns = []
            }
        } catch (error) {
            console.error('Failed to load .pockettignore:', error)
            this.ignorePatterns = []
        }
    }

    public getPatterns(): string[] {
        this.loadPatterns()
        // Return unique patterns
        return Array.from(new Set(this.ignorePatterns))
    }
}

export const ignoreParser = IgnoreParser.getInstance()
