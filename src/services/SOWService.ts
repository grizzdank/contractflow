import { supabase } from '@/lib/supabase/client'

export interface SOWInput {
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

export interface SOWTemplate {
  id: string
  name: string
  description: string | null
  category: string
  is_system_template: boolean
  default_sections: string[]
  variables: Array<{
    key: string
    label: string
    type: string
    options?: string[]
  }>
}

export interface GenerateSOWResponse {
  content: string
  tokensUsed: number
  model: string
  error?: string
  limitReached?: boolean
  remaining?: number
}

// Get or create a session ID for anonymous rate limiting
function getSessionId(): string {
  const key = 'sow_session_id'
  let sessionId = localStorage.getItem(key)
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem(key, sessionId)
  }
  return sessionId
}

export const SOWService = {
  /**
   * Fetch all available templates (system + user's org templates)
   */
  async getTemplates(): Promise<SOWTemplate[]> {
    const { data, error } = await supabase
      .from('sow_templates')
      .select('id, name, description, category, is_system_template, default_sections, variables')
      .order('is_system_template', { ascending: false })
      .order('name')

    if (error) {
      console.error('Error fetching templates:', error)
      return []
    }

    return data || []
  },

  /**
   * Generate a SOW using the AI endpoint
   */
  async generateSOW(
    inputs: SOWInput,
    templateId?: string,
    model?: string
  ): Promise<GenerateSOWResponse> {
    const sessionId = getSessionId()

    const { data, error } = await supabase.functions.invoke('sow-generate', {
      body: {
        inputs,
        templateId,
        model,
        sessionId,
      },
    })

    if (error) {
      console.error('Error generating SOW:', error)
      return {
        content: '',
        tokensUsed: 0,
        model: '',
        error: error.message || 'Failed to generate SOW',
      }
    }

    return data as GenerateSOWResponse
  },

  /**
   * Save a generated SOW (requires authentication)
   */
  async saveSOW(
    title: string,
    inputData: SOWInput,
    generatedContent: string,
    editedContent: string | null,
    templateId: string | null,
    aiModel: string,
    tokensUsed: number
  ): Promise<{ id: string } | null> {
    const { data, error } = await supabase
      .from('generated_sows')
      .insert({
        title,
        input_data: inputData,
        generated_content: generatedContent,
        edited_content: editedContent,
        template_id: templateId,
        ai_model: aiModel,
        tokens_used: tokensUsed,
        status: 'draft',
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error saving SOW:', error)
      return null
    }

    return data
  },

  /**
   * Get saved SOWs for the current user
   */
  async getSavedSOWs(): Promise<any[]> {
    const { data, error } = await supabase
      .from('generated_sows')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching saved SOWs:', error)
      return []
    }

    return data || []
  },

  /**
   * Track an export action
   */
  async trackExport(actionType: 'export_pdf' | 'export_docx' | 'export_copy'): Promise<void> {
    const sessionId = getSessionId()

    await supabase.functions.invoke('sow-generate', {
      body: {
        trackOnly: true,
        sessionId,
        actionType,
      },
    }).catch(() => {
      // Silent fail for tracking
    })
  },
}

export default SOWService
