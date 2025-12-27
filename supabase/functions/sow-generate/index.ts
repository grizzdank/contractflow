import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface SOWInput {
  projectName: string
  clientName: string
  projectDescription: string
  scope: string[]
  deliverables: string[]
  startDate: string
  endDate: string
  milestones?: Array<{ name: string; date: string }>
  budget?: {
    amount: number
    currency: string
    paymentTerms?: string
  }
  additionalTerms?: string
}

interface SOWGenerateRequest {
  templateId?: string
  inputs: SOWInput
  model?: string
  sessionId?: string
}

// Default model - can be switched easily via OpenRouter
const DEFAULT_MODEL = 'anthropic/claude-3.5-sonnet'

// Rate limits
const ANONYMOUS_DAILY_LIMIT = 3
const FREE_TIER_MONTHLY_LIMIT = 10

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY')
    if (!openRouterApiKey) {
      throw new Error('OPENROUTER_API_KEY is not configured')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { templateId, inputs, model, sessionId }: SOWGenerateRequest = await req.json()

    if (!inputs || !inputs.projectName || !inputs.clientName) {
      throw new Error('Missing required inputs: projectName and clientName are required')
    }

    // Check rate limits for anonymous users
    if (sessionId && !req.headers.get('Authorization')) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { count } = await supabase
        .from('sow_usage_tracking')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', sessionId)
        .eq('action_type', 'generation')
        .gte('created_at', today.toISOString())

      if (count !== null && count >= ANONYMOUS_DAILY_LIMIT) {
        return new Response(
          JSON.stringify({
            error: 'Daily limit reached',
            message: `Anonymous users can generate ${ANONYMOUS_DAILY_LIMIT} SOWs per day. Create a free account for more.`,
            limitReached: true,
            remaining: 0,
          }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // Fetch template if provided
    let promptTemplate: string | null = null
    if (templateId) {
      const { data: template } = await supabase
        .from('sow_templates')
        .select('prompt_template')
        .eq('id', templateId)
        .single()

      if (template) {
        promptTemplate = template.prompt_template
      }
    }

    // Build the prompt
    const prompt = buildPrompt(inputs, promptTemplate)

    // Call OpenRouter API
    const selectedModel = model || DEFAULT_MODEL
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': Deno.env.get('SITE_URL') || 'https://contractflow.app',
        'X-Title': 'ContractFlow SOW Generator',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: `You are a professional business document writer specializing in Statements of Work (SOW).
You create clear, comprehensive, and legally-sound SOW documents.
Format your response as clean HTML with proper headings (h2, h3), paragraphs, and lists.
Use professional business language. Be specific and actionable.
Do not include any preamble or explanation - output only the SOW document content.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('OpenRouter API Error:', errorBody)
      throw new Error(`OpenRouter API error: ${response.status}`)
    }

    const result = await response.json()
    const generatedContent = result.choices?.[0]?.message?.content || ''
    const tokensUsed = result.usage?.total_tokens || 0

    // Track usage
    const ipHash = await hashIP(req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || '')
    await supabase.from('sow_usage_tracking').insert({
      session_id: sessionId,
      action_type: 'generation',
      tokens_used: tokensUsed,
      ip_hash: ipHash,
    })

    return new Response(
      JSON.stringify({
        content: generatedContent,
        tokensUsed,
        model: selectedModel,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in sow-generate:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

function buildPrompt(inputs: SOWInput, template?: string | null): string {
  // If we have a template, do simple substitution
  if (template) {
    let prompt = template
      .replace(/\{\{projectName\}\}/g, inputs.projectName)
      .replace(/\{\{clientName\}\}/g, inputs.clientName)
      .replace(/\{\{projectDescription\}\}/g, inputs.projectDescription || '')
      .replace(/\{\{startDate\}\}/g, inputs.startDate || 'TBD')
      .replace(/\{\{endDate\}\}/g, inputs.endDate || 'TBD')

    // Handle arrays
    if (inputs.scope?.length) {
      const scopeList = inputs.scope.map((s) => `- ${s}`).join('\n')
      prompt = prompt.replace(/\{\{#each scope\}\}[\s\S]*?\{\{\/each\}\}/g, scopeList)
    }
    if (inputs.deliverables?.length) {
      const deliverablesList = inputs.deliverables.map((d) => `- ${d}`).join('\n')
      prompt = prompt.replace(/\{\{#each deliverables\}\}[\s\S]*?\{\{\/each\}\}/g, deliverablesList)
    }
    if (inputs.milestones?.length) {
      const milestonesList = inputs.milestones.map((m) => `- ${m.name}: ${m.date}`).join('\n')
      prompt = prompt.replace(/\{\{#if milestones\}\}[\s\S]*?\{\{\/if\}\}/g, `Milestones:\n${milestonesList}`)
    } else {
      prompt = prompt.replace(/\{\{#if milestones\}\}[\s\S]*?\{\{\/if\}\}/g, '')
    }
    if (inputs.budget) {
      const budgetText = `Budget: ${inputs.budget.currency} ${inputs.budget.amount}\nPayment Terms: ${inputs.budget.paymentTerms || 'To be agreed'}`
      prompt = prompt.replace(/\{\{#if budget\}\}[\s\S]*?\{\{\/if\}\}/g, budgetText)
    } else {
      prompt = prompt.replace(/\{\{#if budget\}\}[\s\S]*?\{\{\/if\}\}/g, '')
    }

    return prompt
  }

  // Default prompt if no template
  return `Generate a professional Statement of Work document with the following details:

**Project Name:** ${inputs.projectName}
**Client:** ${inputs.clientName}
**Project Description:** ${inputs.projectDescription || 'Not specified'}

**Scope of Work:**
${inputs.scope?.map((s) => `- ${s}`).join('\n') || '- To be defined'}

**Deliverables:**
${inputs.deliverables?.map((d) => `- ${d}`).join('\n') || '- To be defined'}

**Timeline:**
- Start Date: ${inputs.startDate || 'TBD'}
- End Date: ${inputs.endDate || 'TBD'}
${inputs.milestones?.length ? `\n**Milestones:**\n${inputs.milestones.map((m) => `- ${m.name}: ${m.date}`).join('\n')}` : ''}

${inputs.budget ? `**Budget:** ${inputs.budget.currency} ${inputs.budget.amount.toLocaleString()}\n**Payment Terms:** ${inputs.budget.paymentTerms || 'To be agreed'}` : ''}

${inputs.additionalTerms ? `**Additional Terms:**\n${inputs.additionalTerms}` : ''}

Create a comprehensive, professional SOW document with the following sections:
1. Executive Summary
2. Objectives
3. Scope of Work
4. Deliverables
5. Timeline & Milestones
6. Roles & Responsibilities
7. Pricing & Payment Terms
8. Terms & Conditions
9. Acceptance Criteria

Format as clean HTML with h2 headings for each section.`
}

async function hashIP(ip: string): Promise<string> {
  if (!ip) return ''
  const encoder = new TextEncoder()
  const data = encoder.encode(ip + Deno.env.get('IP_SALT') || 'contractflow')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 64)
}
