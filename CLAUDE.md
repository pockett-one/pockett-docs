# Claude AI Assistant Instructions

## Global Configuration
- **Default Mode:** Auto Accept Edits
- **Default Model:** Sonnet 4.6

## Post-Change Workflow
After *every* change, the AI MUST explicitly offer the user the option to:
1. Run the build
2. Commit and push the changes

**CRITICAL RULE:** NEVER automatically perform the build, commit, or push operations. Always wait for the user's explicit confirmation before running these commands.

## Available Agent Profiles
When asked to assume a specific role, refer to the corresponding agent profile in `.claude/agents/`:
- **Product-Manager agent:** `.claude/agents/product-manager.md`
- **Architecture agent:** `.claude/agents/architecture.md`
- **UX coding agent:** `.claude/agents/ux-coding.md`
- **Coding agent:** `.claude/agents/coding.md`
- **Quality engineer agent:** `.claude/agents/quality-engineer.md`
- **DevOps agent:** `.claude/agents/devops.md`
