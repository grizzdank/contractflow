# AI SOW Generator - Implementation Plan

## Overview
A lightweight AI-powered Statement of Work generator at `/sow-generator` - designed as a standalone tool that can drive revenue quickly while ContractFlow CLM matures.

**Strategy:** Minimal friction entry point → convert to paying users → upsell to full CLM

---

## MVP Scope

### Core Features
1. **SOW Generator Form** - Multi-step input (project details, scope, timeline, budget)
2. **AI Generation** - Anthropic Claude API for content generation
3. **Rich Text Editing** - TipTap editor for post-generation editing
4. **Templates** - Pre-built + user-generated templates with customizable sections
5. **Export** - PDF, Word, Copy to clipboard
6. **Minimal Auth Friction** - Generate without login, login to save

### Out of Scope (Phase 1)
- Team sharing
- API access
- Custom branding on exports
- OpenAI as alternative provider

---

## Database Schema

### New Tables

```sql
-- Pre-built and user templates
CREATE TABLE public.sow_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id TEXT NULL REFERENCES public.organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL, -- consulting, development, design, marketing, custom
    is_system_template BOOLEAN DEFAULT FALSE,
    prompt_template TEXT NOT NULL,
    default_sections JSONB,
    variables JSONB,
    created_by UUID NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated SOW documents
CREATE TABLE public.generated_sows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id TEXT NULL REFERENCES public.organizations(id),
    user_id UUID NULL,
    template_id UUID NULL REFERENCES public.sow_templates(id),
    title VARCHAR(255) NOT NULL,
    input_data JSONB NOT NULL,
    generated_content TEXT NOT NULL,
    edited_content TEXT,
    ai_model VARCHAR(100) NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage tracking for rate limits
CREATE TABLE public.sow_usage_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id TEXT NULL,
    session_id VARCHAR(255),
    action_type VARCHAR(50) NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## File Structure

```
src/
  pages/
    public/
      SOWGenerator.tsx              # Main public page
  components/
    sow/
      SOWGeneratorForm.tsx          # Multi-step form
      SOWTemplateSelector.tsx       # Template picker
      SOWRichTextEditor.tsx         # TipTap editor
      SOWExportPanel.tsx            # Export buttons
      SOWAuthPrompt.tsx             # Login CTA
  services/
    SOWService.ts                   # API calls
  hooks/
    useSOWGeneration.ts             # Generation state

supabase/
  functions/
    sow-generate/index.ts           # AI generation endpoint
    sow-export/index.ts             # PDF/Word export
  migrations/
    YYYYMMDD_add_sow_tables.sql     # Schema migration
```

---

## Critical Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Add `/sow-generator` route |
| `src/components/Navigation.tsx` | Add nav link |
| `package.json` | Add TipTap, jspdf, docx dependencies |
| `.env` | Add `ANTHROPIC_API_KEY` (server-side) |

---

## New Dependencies

```json
{
  "@tiptap/react": "^2.1.0",
  "@tiptap/starter-kit": "^2.1.0",
  "@tiptap/extension-highlight": "^2.1.0",
  "jspdf": "^2.5.1",
  "html2canvas": "^1.4.1",
  "docx": "^8.2.0",
  "file-saver": "^2.0.5"
}
```

---

## User Flow

```
/sow-generator (public)
    │
    ├─► Select template (or start blank)
    │
    ├─► Fill form inputs
    │      • Project name, client, description
    │      • Scope items (dynamic list)
    │      • Timeline & milestones
    │      • Budget (optional)
    │
    ├─► Click "Generate SOW"
    │      • Rate limit check (3/day anonymous)
    │      • AI generates content
    │
    ├─► Edit in rich text editor
    │
    └─► Export
           • Copy (free, instant)
           • PDF (free)
           • Word (free)
           • Save prompt → login CTA
```

---

## Pricing Tiers

| Tier | Generations | Templates | Save | Price |
|------|-------------|-----------|------|-------|
| Anonymous | 3/day | System only | No | Free |
| Free Account | 10/month | System only | 10 SOWs | Free |
| Pro | Unlimited | Custom | Unlimited | $19/mo |

---

## Implementation Phases

### Phase 1: MVP (Target: 1-2 weeks)
- [ ] Database migration for new tables
- [ ] `sow-generate` Edge Function with Anthropic
- [ ] Basic `SOWGenerator.tsx` page with form
- [ ] Simple content display (read-only initially)
- [ ] Copy-to-clipboard export
- [ ] 3 system templates (Consulting, Development, General)
- [ ] Rate limiting for anonymous

### Phase 2: Full Editing (1 week)
- [ ] TipTap rich text editor integration
- [ ] PDF export with jspdf
- [ ] Word export with docx package
- [ ] Template selector UI

### Phase 3: Auth & Saving (1 week)
- [ ] Save SOW functionality (authenticated users)
- [ ] Custom template creation
- [ ] Dashboard section for saved SOWs
- [ ] Usage tracking and tier limits

### Phase 4: Polish (ongoing)
- [ ] More system templates
- [ ] Improved prompts and generation quality
- [ ] Landing page optimization
- [ ] Analytics and conversion tracking

---

## Edge Function: sow-generate

```typescript
// supabase/functions/sow-generate/index.ts
serve(async (req) => {
  // 1. CORS handling
  // 2. Parse request (template, inputs, sessionId)
  // 3. Check rate limits
  // 4. Build prompt from template + inputs
  // 5. Call Anthropic API
  // 6. Track usage
  // 7. Return generated HTML content
});
```

---

## System Templates (Initial)

1. **Consulting Services** - Advisory, strategy, assessments
2. **Software Development** - Web/mobile apps, API work
3. **Design Services** - Branding, UI/UX, marketing design
4. **Marketing Campaign** - Digital, content, social media
5. **General Professional Services** - Flexible catch-all

---

## Success Metrics

- Generations per day/week
- Conversion: Anonymous → Account
- Conversion: Free → Pro
- Export rate (indicator of value)
- Time to first generation (onboarding friction)

---

## Notes

- Legal docs (ToS, Privacy Policy) already mention AI SOW - need to update if scope differs
- Existing `downloadTemplate()` in ContractRequest.tsx can be deprecated once this ships
- Consider future integration: Generated SOW → Create Contract workflow
