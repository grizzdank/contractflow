-- AI SOW Generator Tables
-- Supports template-based AI generation, user customization, and usage tracking

-- ============================================================================
-- SOW Templates Table
-- Stores both system templates and user-created templates
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sow_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL CHECK (category IN ('consulting', 'development', 'design', 'marketing', 'professional', 'custom')),
    is_system_template BOOLEAN DEFAULT FALSE,
    prompt_template TEXT NOT NULL,
    default_sections JSONB DEFAULT '[]'::jsonb,
    variables JSONB DEFAULT '[]'::jsonb,
    created_by UUID NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for fast template lookups
CREATE INDEX idx_sow_templates_category ON public.sow_templates(category);
CREATE INDEX idx_sow_templates_org ON public.sow_templates(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_sow_templates_system ON public.sow_templates(is_system_template) WHERE is_system_template = TRUE;

-- ============================================================================
-- Generated SOWs Table
-- Stores user-generated SOW documents
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.generated_sows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NULL,
    template_id UUID NULL REFERENCES public.sow_templates(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    input_data JSONB NOT NULL,
    generated_content TEXT NOT NULL,
    edited_content TEXT,
    ai_model VARCHAR(100) NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'finalized', 'exported')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for user lookups
CREATE INDEX idx_generated_sows_org ON public.generated_sows(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_generated_sows_user ON public.generated_sows(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_generated_sows_created ON public.generated_sows(created_at DESC);

-- ============================================================================
-- SOW Usage Tracking Table
-- Tracks generations for rate limiting and analytics
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sow_usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NULL,
    session_id VARCHAR(255),
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('generation', 'export_pdf', 'export_docx', 'export_copy', 'template_save')),
    tokens_used INTEGER DEFAULT 0,
    ip_hash VARCHAR(64), -- Hashed IP for privacy
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for rate limiting queries
CREATE INDEX idx_sow_usage_session_date ON public.sow_usage_tracking(session_id, created_at DESC);
CREATE INDEX idx_sow_usage_org_date ON public.sow_usage_tracking(organization_id, created_at DESC) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_sow_usage_action ON public.sow_usage_tracking(action_type, created_at DESC);

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE public.sow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_sows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sow_usage_tracking ENABLE ROW LEVEL SECURITY;

-- SOW Templates Policies
-- System templates are public (no auth required)
CREATE POLICY "Public read access to system templates"
ON public.sow_templates
FOR SELECT
USING (is_system_template = TRUE);

-- Authenticated users can read their org's custom templates
CREATE POLICY "Org members can read their templates"
ON public.sow_templates
FOR SELECT
USING (
    is_system_template = FALSE
    AND organization_id IS NOT NULL
    AND organization_id = (auth.jwt() ->> 'o_id')::text
);

-- Authenticated users can manage their org's custom templates
CREATE POLICY "Org members can manage their templates"
ON public.sow_templates
FOR ALL
USING (
    is_system_template = FALSE
    AND organization_id IS NOT NULL
    AND organization_id = (auth.jwt() ->> 'o_id')::text
)
WITH CHECK (
    is_system_template = FALSE
    AND organization_id IS NOT NULL
    AND organization_id = (auth.jwt() ->> 'o_id')::text
);

-- Generated SOWs Policies
-- Users can only access their own organization's SOWs
CREATE POLICY "Org members can manage their SOWs"
ON public.generated_sows
FOR ALL
USING (
    organization_id IS NOT NULL
    AND organization_id = (auth.jwt() ->> 'o_id')::text
)
WITH CHECK (
    organization_id IS NOT NULL
    AND organization_id = (auth.jwt() ->> 'o_id')::text
);

-- Usage Tracking Policies
-- Service role can insert (Edge Functions)
CREATE POLICY "Service role can insert usage tracking"
ON public.sow_usage_tracking
FOR INSERT
WITH CHECK (TRUE);

-- Org members can view their usage
CREATE POLICY "Org members can view their usage"
ON public.sow_usage_tracking
FOR SELECT
USING (
    organization_id IS NOT NULL
    AND organization_id = (auth.jwt() ->> 'o_id')::text
);

-- ============================================================================
-- Updated At Trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_sow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sow_templates_updated_at
    BEFORE UPDATE ON public.sow_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_sow_updated_at();

CREATE TRIGGER generated_sows_updated_at
    BEFORE UPDATE ON public.generated_sows
    FOR EACH ROW
    EXECUTE FUNCTION update_sow_updated_at();

-- ============================================================================
-- Seed System Templates
-- ============================================================================

INSERT INTO public.sow_templates (
    name,
    description,
    category,
    is_system_template,
    prompt_template,
    default_sections,
    variables
) VALUES
(
    'Consulting Services',
    'Professional consulting engagement for advisory, strategy, or assessment work',
    'consulting',
    TRUE,
    'Generate a professional Statement of Work for a consulting engagement with the following details:

Project: {{projectName}}
Client: {{clientName}}
Description: {{projectDescription}}

Scope of Work:
{{#each scope}}
- {{this}}
{{/each}}

Deliverables:
{{#each deliverables}}
- {{this}}
{{/each}}

Timeline: {{startDate}} to {{endDate}}
{{#if milestones}}
Milestones:
{{#each milestones}}
- {{this.name}}: {{this.date}}
{{/each}}
{{/if}}

{{#if budget}}
Budget: {{budget.currency}} {{budget.amount}}
Payment Terms: {{budget.paymentTerms}}
{{/if}}

Create a formal, comprehensive SOW document with these sections:
1. Executive Summary
2. Objectives
3. Scope of Work
4. Approach & Methodology
5. Deliverables
6. Timeline & Milestones
7. Team & Resources
8. Fees & Payment Terms
9. Terms & Conditions
10. Acceptance Criteria

Use professional business language. Be specific and actionable.',
    '["Executive Summary", "Objectives", "Scope of Work", "Approach & Methodology", "Deliverables", "Timeline & Milestones", "Team & Resources", "Fees & Payment Terms", "Terms & Conditions", "Acceptance Criteria"]'::jsonb,
    '[{"key": "consultingArea", "label": "Consulting Area", "type": "select", "options": ["Strategy", "Operations", "Technology", "HR", "Finance", "Other"]}]'::jsonb
),
(
    'Software Development',
    'Custom software, web application, or mobile app development project',
    'development',
    TRUE,
    'Generate a professional Statement of Work for a software development project with the following details:

Project: {{projectName}}
Client: {{clientName}}
Description: {{projectDescription}}

Technical Scope:
{{#each scope}}
- {{this}}
{{/each}}

Deliverables:
{{#each deliverables}}
- {{this}}
{{/each}}

Timeline: {{startDate}} to {{endDate}}
{{#if milestones}}
Milestones/Sprints:
{{#each milestones}}
- {{this.name}}: {{this.date}}
{{/each}}
{{/if}}

{{#if budget}}
Budget: {{budget.currency}} {{budget.amount}}
Payment Terms: {{budget.paymentTerms}}
{{/if}}

Create a comprehensive technical SOW document with these sections:
1. Project Overview
2. Technical Requirements
3. System Architecture
4. Features & User Stories
5. Development Phases/Sprints
6. Deliverables & Acceptance Criteria
7. Testing & QA Requirements
8. Deployment Plan
9. Support & Maintenance
10. Budget & Payment Schedule

Use clear technical language. Include acceptance criteria for each deliverable.',
    '["Project Overview", "Technical Requirements", "System Architecture", "Features & User Stories", "Development Phases", "Deliverables & Acceptance Criteria", "Testing & QA", "Deployment Plan", "Support & Maintenance", "Budget & Payment Schedule"]'::jsonb,
    '[{"key": "projectType", "label": "Project Type", "type": "select", "options": ["Web Application", "Mobile App", "API/Backend", "Full Stack", "Integration"]}, {"key": "methodology", "label": "Methodology", "type": "select", "options": ["Agile/Scrum", "Waterfall", "Hybrid"]}]'::jsonb
),
(
    'Design Services',
    'Graphic design, UI/UX, branding, or marketing collateral projects',
    'design',
    TRUE,
    'Generate a professional Statement of Work for a design project with the following details:

Project: {{projectName}}
Client: {{clientName}}
Description: {{projectDescription}}

Design Scope:
{{#each scope}}
- {{this}}
{{/each}}

Deliverables:
{{#each deliverables}}
- {{this}}
{{/each}}

Timeline: {{startDate}} to {{endDate}}
{{#if milestones}}
Milestones:
{{#each milestones}}
- {{this.name}}: {{this.date}}
{{/each}}
{{/if}}

{{#if budget}}
Budget: {{budget.currency}} {{budget.amount}}
Payment Terms: {{budget.paymentTerms}}
{{/if}}

Create a comprehensive design SOW document with these sections:
1. Creative Brief
2. Design Objectives
3. Scope of Design Work
4. Deliverables & File Formats
5. Design Process & Phases
6. Revision Policy
7. Timeline & Milestones
8. Usage Rights & Licensing
9. Pricing & Payment Terms
10. Approval Process

Be specific about deliverable formats, revision rounds, and usage rights.',
    '["Creative Brief", "Design Objectives", "Scope of Work", "Deliverables & Formats", "Design Process", "Revision Policy", "Timeline", "Usage Rights", "Pricing", "Approval Process"]'::jsonb,
    '[{"key": "designType", "label": "Design Type", "type": "select", "options": ["Brand Identity", "UI/UX Design", "Marketing Collateral", "Website Design", "Packaging"]}]'::jsonb
),
(
    'Marketing Campaign',
    'Digital marketing, content marketing, or advertising campaign services',
    'marketing',
    TRUE,
    'Generate a professional Statement of Work for a marketing campaign with the following details:

Campaign: {{projectName}}
Client: {{clientName}}
Description: {{projectDescription}}

Campaign Scope:
{{#each scope}}
- {{this}}
{{/each}}

Deliverables:
{{#each deliverables}}
- {{this}}
{{/each}}

Timeline: {{startDate}} to {{endDate}}
{{#if milestones}}
Campaign Phases:
{{#each milestones}}
- {{this.name}}: {{this.date}}
{{/each}}
{{/if}}

{{#if budget}}
Budget: {{budget.currency}} {{budget.amount}}
Payment Terms: {{budget.paymentTerms}}
{{/if}}

Create a comprehensive marketing SOW document with these sections:
1. Campaign Overview
2. Objectives & KPIs
3. Target Audience
4. Strategy & Channels
5. Creative Assets
6. Campaign Calendar
7. Deliverables
8. Reporting & Analytics
9. Budget Allocation
10. Terms & Conditions

Include specific, measurable KPIs and success metrics.',
    '["Campaign Overview", "Objectives & KPIs", "Target Audience", "Strategy & Channels", "Creative Assets", "Campaign Calendar", "Deliverables", "Reporting & Analytics", "Budget Allocation", "Terms & Conditions"]'::jsonb,
    '[{"key": "campaignType", "label": "Campaign Type", "type": "select", "options": ["Digital Marketing", "Content Marketing", "Social Media", "Email Marketing", "Paid Advertising", "SEO/SEM"]}]'::jsonb
),
(
    'General Professional Services',
    'Flexible template for various professional service engagements',
    'professional',
    TRUE,
    'Generate a professional Statement of Work with the following details:

Project: {{projectName}}
Client: {{clientName}}
Description: {{projectDescription}}

Scope of Work:
{{#each scope}}
- {{this}}
{{/each}}

Deliverables:
{{#each deliverables}}
- {{this}}
{{/each}}

Timeline: {{startDate}} to {{endDate}}
{{#if milestones}}
Milestones:
{{#each milestones}}
- {{this.name}}: {{this.date}}
{{/each}}
{{/if}}

{{#if budget}}
Budget: {{budget.currency}} {{budget.amount}}
Payment Terms: {{budget.paymentTerms}}
{{/if}}

Create a professional SOW document with these sections:
1. Introduction & Background
2. Objectives
3. Scope of Services
4. Deliverables
5. Timeline & Schedule
6. Roles & Responsibilities
7. Pricing & Payment Terms
8. Terms & Conditions
9. Acceptance Criteria

Use clear, professional language appropriate for a formal business agreement.',
    '["Introduction", "Objectives", "Scope of Services", "Deliverables", "Timeline", "Roles & Responsibilities", "Pricing", "Terms & Conditions", "Acceptance Criteria"]'::jsonb,
    '[]'::jsonb
);
