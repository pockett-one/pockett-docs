# Antigravity CLI & Claude Code Proxy: Complete Reference

## 1. Fresh Setup
1. **Install Claude Code Native:** `curl -fsSL https://claude.ai | sh`
2. **Install Proxy:** `npm install -g antigravity-claude-proxy`
3. **Link Account:** `antigravity-claude-proxy accounts add`
4. **Configure Settings:** Update `~/.claude/settings.json` (or create it) with:

{
  "env": {
    "ANTHROPIC_BASE_URL": "http://localhost:8080",
    "ANTHROPIC_AUTH_TOKEN": "antigravity"
  },
  "hasCompletedOnboarding": true
}

## 2. Daily Usage
1. **Start Bridge (Terminal 1):** `antigravity-claude-proxy start`
2. **Launch Agent (Terminal 2):** `claude`

## 3. Troubleshooting
- **Check Health:** `curl http://localhost:8080/health`
- **Check Config:** `claude config list`
- **Expired Session:** Re-run `antigravity-claude-proxy accounts add`

## 4. Uninstall & Revert to Official Claude
1. **Remove Proxy:** `npm uninstall -g antigravity-claude-proxy`
2. **Reset Config:**
   - **macOS/Linux:** `rm -rf ~/.claude/`
   - **Windows:** `Remove-Item -Path "$env:USERPROFILE\.claude" -Recurse -Force`
3. **Clean Environment:** Remove `ANTHROPIC_BASE_URL` or `ANTHROPIC_API_KEY` from `.zshrc` or `.bashrc`.
4. **Official Login:** Run `claude` and follow the standard login prompts.

