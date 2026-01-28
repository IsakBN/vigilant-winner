'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button, Input, Label, Card, CardContent, Slider, Switch, Textarea } from '@/components/ui'
import { ArrowLeft, ArrowRight, Check, Loader2, Plus, Trash2, Beaker, AlertTriangle } from 'lucide-react'

export interface CreateExperimentWizardProps {
  appId: string
  onSuccess: (testId: string) => void
  onCancel: () => void
}

interface VariantConfig {
  id: string
  name: string
  branch: string
  percentage: number
  isControl: boolean
}

const STEPS = [
  { id: 'name', title: 'Name' },
  { id: 'variants', title: 'Variants' },
  { id: 'review', title: 'Review' },
]

const VARIANT_NAMES = ['A', 'B', 'C', 'D']

export function CreateExperimentWizard({ appId, onSuccess, onCancel }: CreateExperimentWizardProps) {
  const [step, setStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [variants, setVariants] = useState<VariantConfig[]>([
    { id: '1', name: 'A', branch: '', percentage: 50, isControl: true },
    { id: '2', name: 'B', branch: '', percentage: 50, isControl: false },
  ])

  const totalPct = variants.reduce((sum, v) => sum + v.percentage, 0)
  const isPctValid = Math.abs(totalPct - 100) < 0.01
  const hasControl = variants.some((v) => v.isControl)

  const addVariant = useCallback(() => {
    if (variants.length >= 4) return
    setVariants((prev) => [...prev, { id: String(Date.now()), name: VARIANT_NAMES[prev.length] ?? 'X', branch: '', percentage: 0, isControl: false }])
  }, [variants.length])

  const removeVariant = useCallback((id: string) => setVariants((prev) => prev.filter((v) => v.id !== id)), [])

  const updateVariant = useCallback((id: string, field: keyof VariantConfig, value: string | number | boolean) => {
    setVariants((prev) => {
      const updated = prev.map((v) => (v.id === id ? { ...v, [field]: value } : v))
      if (field === 'isControl' && value === true) {
        return updated.map((v) => (v.id === id ? v : { ...v, isControl: false }))
      }
      return updated
    })
  }, [])

  const handleSubmit = useCallback(async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
    onSuccess(`exp_${Date.now()}`)
  }, [onSuccess])

  const canProceed = step === 0 ? name.trim().length > 0 : isPctValid && hasControl

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8 flex items-center justify-between">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium', i < step && 'bg-green-500 text-white', i === step && 'bg-neutral-900 text-white', i > step && 'bg-neutral-200 text-neutral-500')}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className="text-xs text-neutral-500 mt-1">{s.title}</span>
            </div>
            {i < STEPS.length - 1 && <div className={cn('w-24 h-0.5 mx-2', i < step ? 'bg-green-500' : 'bg-neutral-200')} />}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          {step === 0 && <StepName name={name} setName={setName} description={description} setDescription={setDescription} />}
          {step === 1 && <StepVariants variants={variants} onAdd={addVariant} onRemove={removeVariant} onChange={updateVariant} isPctValid={isPctValid} totalPct={totalPct} />}
          {step === 2 && <StepReview name={name} description={description} variants={variants} />}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <Button variant="outline" onClick={step === 0 ? onCancel : () => setStep((p) => p - 1)} disabled={isLoading}>
          {step === 0 ? 'Cancel' : <><ArrowLeft className="w-4 h-4 mr-1.5" />Back</>}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep((p) => p + 1)} disabled={!canProceed}>Next<ArrowRight className="w-4 h-4 ml-1.5" /></Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isLoading || !canProceed}>
            {isLoading ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Creating...</> : <><Beaker className="w-4 h-4 mr-1.5" />Launch Experiment</>}
          </Button>
        )}
      </div>
    </div>
  )
}

function StepName({ name, setName, description, setDescription }: { name: string; setName: (v: string) => void; description: string; setDescription: (v: string) => void }) {
  return (
    <div className="space-y-4">
      <div><Label htmlFor="name">Experiment Name</Label><Input id="name" placeholder="e.g., New Checkout Flow" value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div><Label htmlFor="description">Description (optional)</Label><Textarea id="description" placeholder="What are you testing?" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
    </div>
  )
}

function StepVariants({ variants, onAdd, onRemove, onChange, isPctValid, totalPct }: {
  variants: VariantConfig[]; onAdd: () => void; onRemove: (id: string) => void
  onChange: (id: string, field: keyof VariantConfig, value: string | number | boolean) => void
  isPctValid: boolean; totalPct: number
}) {
  return (
    <div className="space-y-4">
      {variants.map((v) => (
        <div key={v.id} className={cn('border rounded-lg p-4 space-y-3', v.isControl ? 'border-blue-200 bg-blue-50/50' : 'border-neutral-200')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Switch checked={v.isControl} onCheckedChange={(checked) => onChange(v.id, 'isControl', checked)} />
              <span className="text-sm">{v.isControl ? 'Control' : 'Set as control'}</span>
            </div>
            {!v.isControl && variants.length > 2 && (
              <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(v.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Variant Name</Label><Input value={v.name} onChange={(e) => onChange(v.id, 'name', e.target.value)} className="h-9" /></div>
            <div><Label className="text-xs">Branch/Bundle</Label><Input placeholder="main, feature/..." value={v.branch} onChange={(e) => onChange(v.id, 'branch', e.target.value)} className="h-9" /></div>
          </div>
          <div>
            <Label className="text-xs">Traffic: {v.percentage}%</Label>
            <Slider value={[v.percentage]} min={0} max={100} step={1} onValueChange={([val]) => onChange(v.id, 'percentage', val ?? 0)} />
          </div>
        </div>
      ))}
      {variants.length < 4 && <Button type="button" variant="outline" onClick={onAdd} className="w-full"><Plus className="w-4 h-4 mr-1.5" />Add Variant</Button>}
      <div className={cn('flex items-center gap-2 text-sm p-3 rounded-lg', isPctValid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
        {isPctValid ? <><Check className="w-4 h-4" />Total: 100%</> : <><AlertTriangle className="w-4 h-4" />Total: {totalPct}% (must be 100%)</>}
      </div>
    </div>
  )
}

function StepReview({ name, description, variants }: { name: string; description: string; variants: VariantConfig[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center"><Beaker className="w-5 h-5 text-blue-600" /></div>
        <div><h3 className="font-semibold text-neutral-900">{name}</h3>{description && <p className="text-sm text-neutral-500">{description}</p>}</div>
      </div>
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-neutral-700">Variants</h4>
        {variants.map((v) => (
          <div key={v.id} className="flex items-center justify-between text-sm p-3 border rounded-lg">
            <div className="flex items-center gap-2"><span className="font-medium">{v.name}</span>{v.isControl && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Control</span>}</div>
            <div className="flex items-center gap-4 text-neutral-500"><span>{v.branch || 'No branch'}</span><span className="font-medium text-neutral-900">{v.percentage}%</span></div>
          </div>
        ))}
      </div>
      <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm text-amber-700">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div><p className="font-medium">Ready to launch?</p><p className="mt-1">Devices will be randomly assigned to variants. You can end the test at any time.</p></div>
        </div>
      </div>
    </div>
  )
}
