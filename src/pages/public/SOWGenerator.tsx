import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileText,
  Sparkles,
  Plus,
  X,
  Copy,
  Download,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Building,
  ClipboardList,
  DollarSign,
  CheckCircle2,
} from 'lucide-react'
import PublicNavigation from '@/components/PublicNavigation'
import SOWService, { SOWInput, SOWTemplate, GenerateSOWResponse } from '@/services/SOWService'

// Form steps
const STEPS = [
  { id: 'project', title: 'Project Details', icon: Building },
  { id: 'scope', title: 'Scope & Deliverables', icon: ClipboardList },
  { id: 'timeline', title: 'Timeline', icon: Calendar },
  { id: 'budget', title: 'Budget (Optional)', icon: DollarSign },
]

const SOWGenerator = () => {
  const navigate = useNavigate()
  const { toast } = useToast()

  // State
  const [currentStep, setCurrentStep] = useState(0)
  const [templates, setTemplates] = useState<SOWTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)
  const [generationMeta, setGenerationMeta] = useState<{ model: string; tokens: number } | null>(null)

  // Form data
  const [formData, setFormData] = useState<SOWInput>({
    projectName: '',
    clientName: '',
    projectDescription: '',
    scope: [''],
    deliverables: [''],
    startDate: '',
    endDate: '',
    milestones: [],
    budget: undefined,
    additionalTerms: '',
  })

  // Budget toggle
  const [includeBudget, setIncludeBudget] = useState(false)
  const [budgetAmount, setBudgetAmount] = useState('')
  const [budgetCurrency, setBudgetCurrency] = useState('USD')
  const [paymentTerms, setPaymentTerms] = useState('')

  // Load templates on mount
  useEffect(() => {
    SOWService.getTemplates().then(setTemplates).catch(console.error)
  }, [])

  // Handle form field changes
  const updateField = (field: keyof SOWInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Handle array fields (scope, deliverables)
  const addArrayItem = (field: 'scope' | 'deliverables') => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], ''],
    }))
  }

  const removeArrayItem = (field: 'scope' | 'deliverables', index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }))
  }

  const updateArrayItem = (field: 'scope' | 'deliverables', index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }))
  }

  // Handle milestones
  const addMilestone = () => {
    setFormData((prev) => ({
      ...prev,
      milestones: [...(prev.milestones || []), { name: '', date: '' }],
    }))
  }

  const removeMilestone = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      milestones: prev.milestones?.filter((_, i) => i !== index),
    }))
  }

  const updateMilestone = (index: number, field: 'name' | 'date', value: string) => {
    setFormData((prev) => ({
      ...prev,
      milestones: prev.milestones?.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    }))
  }

  // Navigation
  const canProceed = () => {
    switch (currentStep) {
      case 0: // Project Details
        return formData.projectName.trim() && formData.clientName.trim()
      case 1: // Scope & Deliverables
        return formData.scope.some((s) => s.trim()) && formData.deliverables.some((d) => d.trim())
      case 2: // Timeline
        return formData.startDate && formData.endDate
      case 3: // Budget (optional)
        return true
      default:
        return true
    }
  }

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  // Generate SOW
  const handleGenerate = async () => {
    setIsGenerating(true)

    // Prepare data
    const inputData: SOWInput = {
      ...formData,
      scope: formData.scope.filter((s) => s.trim()),
      deliverables: formData.deliverables.filter((d) => d.trim()),
      milestones: formData.milestones?.filter((m) => m.name.trim()),
    }

    if (includeBudget && budgetAmount) {
      inputData.budget = {
        amount: parseFloat(budgetAmount),
        currency: budgetCurrency,
        paymentTerms: paymentTerms || undefined,
      }
    }

    try {
      const result: GenerateSOWResponse = await SOWService.generateSOW(
        inputData,
        selectedTemplate || undefined
      )

      if (result.error) {
        if (result.limitReached) {
          toast({
            title: 'Daily limit reached',
            description: 'Create a free account to generate more SOWs.',
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'Generation failed',
            description: result.error,
            variant: 'destructive',
          })
        }
        return
      }

      setGeneratedContent(result.content)
      setGenerationMeta({ model: result.model, tokens: result.tokensUsed })
      toast({
        title: 'SOW Generated!',
        description: 'Your Statement of Work is ready to review and export.',
      })
    } catch (error) {
      console.error('Generation error:', error)
      toast({
        title: 'Error',
        description: 'Failed to generate SOW. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Copy to clipboard
  const handleCopy = async () => {
    if (!generatedContent) return

    // Strip HTML for plain text copy
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = generatedContent
    const plainText = tempDiv.textContent || tempDiv.innerText

    try {
      await navigator.clipboard.writeText(plainText)
      toast({
        title: 'Copied!',
        description: 'SOW content copied to clipboard.',
      })
      SOWService.trackExport('export_copy')
    } catch (err) {
      toast({
        title: 'Copy failed',
        description: 'Please select and copy manually.',
        variant: 'destructive',
      })
    }
  }

  // Reset and start over
  const handleReset = () => {
    setGeneratedContent(null)
    setGenerationMeta(null)
    setCurrentStep(0)
  }

  // Render template selector
  const renderTemplateSelector = () => (
    <div className="mb-8">
      <Label className="text-sm font-medium mb-3 block">Choose a Template (Optional)</Label>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          onClick={() => setSelectedTemplate(null)}
          className={`p-4 rounded-lg border text-left transition-all ${
            selectedTemplate === null
              ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <FileText className="h-5 w-5 mb-2 text-muted-foreground" />
          <div className="font-medium text-sm">Blank</div>
          <div className="text-xs text-muted-foreground">Start fresh</div>
        </button>

        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => setSelectedTemplate(template.id)}
            className={`p-4 rounded-lg border text-left transition-all ${
              selectedTemplate === template.id
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <FileText className="h-5 w-5 mb-2 text-muted-foreground" />
            <div className="font-medium text-sm">{template.name}</div>
            <div className="text-xs text-muted-foreground capitalize">{template.category}</div>
          </button>
        ))}
      </div>
    </div>
  )

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Project Details
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="projectName">Project Name *</Label>
              <Input
                id="projectName"
                placeholder="e.g., Website Redesign Project"
                value={formData.projectName}
                onChange={(e) => updateField('projectName', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                placeholder="e.g., Acme Corporation"
                value={formData.clientName}
                onChange={(e) => updateField('clientName', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="projectDescription">Project Description</Label>
              <Textarea
                id="projectDescription"
                placeholder="Describe the project's purpose, goals, and context..."
                rows={4}
                value={formData.projectDescription}
                onChange={(e) => updateField('projectDescription', e.target.value)}
              />
            </div>
          </div>
        )

      case 1: // Scope & Deliverables
        return (
          <div className="space-y-6">
            <div>
              <Label className="mb-2 block">Scope of Work *</Label>
              <p className="text-sm text-muted-foreground mb-3">
                List the main activities and tasks to be performed
              </p>
              {formData.scope.map((item, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    placeholder={`Scope item ${index + 1}`}
                    value={item}
                    onChange={(e) => updateArrayItem('scope', index, e.target.value)}
                  />
                  {formData.scope.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeArrayItem('scope', index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addArrayItem('scope')}>
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
            </div>

            <div>
              <Label className="mb-2 block">Deliverables *</Label>
              <p className="text-sm text-muted-foreground mb-3">
                List the tangible outputs to be delivered
              </p>
              {formData.deliverables.map((item, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    placeholder={`Deliverable ${index + 1}`}
                    value={item}
                    onChange={(e) => updateArrayItem('deliverables', index, e.target.value)}
                  />
                  {formData.deliverables.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeArrayItem('deliverables', index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addArrayItem('deliverables')}>
                <Plus className="h-4 w-4 mr-1" /> Add Deliverable
              </Button>
            </div>
          </div>
        )

      case 2: // Timeline
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => updateField('startDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => updateField('endDate', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Milestones (Optional)</Label>
              <p className="text-sm text-muted-foreground mb-3">Add key project milestones</p>
              {formData.milestones?.map((milestone, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    placeholder="Milestone name"
                    value={milestone.name}
                    onChange={(e) => updateMilestone(index, 'name', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="date"
                    value={milestone.date}
                    onChange={(e) => updateMilestone(index, 'date', e.target.value)}
                    className="w-40"
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeMilestone(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addMilestone}>
                <Plus className="h-4 w-4 mr-1" /> Add Milestone
              </Button>
            </div>
          </div>
        )

      case 3: // Budget
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeBudget"
                checked={includeBudget}
                onChange={(e) => setIncludeBudget(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="includeBudget" className="cursor-pointer">
                Include budget information
              </Label>
            </div>

            {includeBudget && (
              <div className="space-y-4 pl-6 border-l-2 border-primary/20">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="budgetAmount">Budget Amount</Label>
                    <Input
                      id="budgetAmount"
                      type="number"
                      placeholder="50000"
                      value={budgetAmount}
                      onChange={(e) => setBudgetAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={budgetCurrency} onValueChange={setBudgetCurrency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="CAD">CAD ($)</SelectItem>
                        <SelectItem value="AUD">AUD ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Textarea
                    id="paymentTerms"
                    placeholder="e.g., 50% upfront, 25% at midpoint, 25% on completion"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="additionalTerms">Additional Terms (Optional)</Label>
              <Textarea
                id="additionalTerms"
                placeholder="Any other terms, conditions, or notes to include..."
                value={formData.additionalTerms}
                onChange={(e) => updateField('additionalTerms', e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Render generated content
  const renderGeneratedContent = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <span className="font-medium">SOW Generated Successfully</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="h-4 w-4 mr-1" /> Copy
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            Start Over
          </Button>
        </div>
      </div>

      {generationMeta && (
        <p className="text-xs text-muted-foreground">
          Generated with {generationMeta.model} ({generationMeta.tokens} tokens)
        </p>
      )}

      <Card>
        <CardContent className="p-6">
          <div
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: generatedContent || '' }}
          />
        </CardContent>
      </Card>

      <div className="flex justify-center gap-4 pt-4">
        <Button onClick={handleCopy} size="lg">
          <Copy className="h-4 w-4 mr-2" /> Copy to Clipboard
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        PDF and Word export coming soon. Create a free account to save your SOWs.
      </p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <PublicNavigation />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-4">
            <Sparkles className="h-4 w-4" />
            AI-Powered
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Statement of Work Generator
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Generate professional SOW documents in seconds. No signup required.
          </p>
        </div>

        {generatedContent ? (
          renderGeneratedContent()
        ) : (
          <>
            {/* Template Selector */}
            {renderTemplateSelector()}

            {/* Form Card */}
            <Card>
              <CardHeader>
                {/* Step Indicator */}
                <div className="flex items-center justify-between mb-4">
                  {STEPS.map((step, index) => {
                    const StepIcon = step.icon
                    const isActive = index === currentStep
                    const isCompleted = index < currentStep

                    return (
                      <div key={step.id} className="flex items-center">
                        <button
                          onClick={() => index < currentStep && setCurrentStep(index)}
                          disabled={index > currentStep}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : isCompleted
                              ? 'bg-primary/10 text-primary cursor-pointer hover:bg-primary/20'
                              : 'text-muted-foreground'
                          }`}
                        >
                          <StepIcon className="h-4 w-4" />
                          <span className="hidden md:inline text-sm font-medium">{step.title}</span>
                        </button>
                        {index < STEPS.length - 1 && (
                          <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
                        )}
                      </div>
                    )
                  })}
                </div>

                <CardTitle>{STEPS[currentStep].title}</CardTitle>
                <CardDescription>
                  Step {currentStep + 1} of {STEPS.length}
                </CardDescription>
              </CardHeader>

              <CardContent>
                {renderStepContent()}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t">
                  <Button
                    variant="ghost"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Back
                  </Button>

                  {currentStep < STEPS.length - 1 ? (
                    <Button onClick={nextStep} disabled={!canProceed()}>
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerating || !canProceed()}
                      className="bg-gradient-to-r from-primary to-primary/80"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" /> Generate SOW
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Footer note */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          Free: 3 generations per day. Create an account for more.
        </p>
      </main>
    </div>
  )
}

export default SOWGenerator
