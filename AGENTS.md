# Agent Instructions

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds

## Feature: AI SOW Generator

A lightweight AI-powered Statement of Work generator at `/sow-generator` - designed as a standalone tool for quick revenue while the full CLM matures.

### Key Files
- `src/pages/public/SOWGenerator.tsx` - Main public page with multi-step form
- `src/services/SOWService.ts` - API service for generation
- `supabase/functions/sow-generate/` - Edge Function (OpenRouter API)
- `supabase/migrations/20251227000000_add_sow_generator_tables.sql` - Schema

### Setup
```bash
# Set OpenRouter API key as Supabase secret
supabase secrets set OPENROUTER_API_KEY=your_key_here

# Apply migration (when Supabase is active)
supabase db push
```

### Templates
5 system templates seeded in migration: Consulting, Development, Design, Marketing, General

### Rate Limits
- Anonymous: 3/day (tracked by session ID)
- Free account: 10/month
- Pro: Unlimited

