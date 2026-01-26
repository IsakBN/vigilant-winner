'use client'

/**
 * TargetingRules Component
 *
 * Builder for targeting rules that control which devices receive updates.
 */

import { Plus, Trash2 } from 'lucide-react'
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  CardContent,
  Label,
} from '@/components/ui'
import type { ChannelTargetingRule, ChannelTargetingRules } from '@/lib/api'

// =============================================================================
// Types
// =============================================================================

interface TargetingRulesProps {
  value: ChannelTargetingRules | null
  onChange: (rules: ChannelTargetingRules | null) => void
  disabled?: boolean
}

// =============================================================================
// Constants
// =============================================================================

const FIELD_OPTIONS = [
  { value: 'appVersion', label: 'App Version' },
  { value: 'osVersion', label: 'OS Version' },
  { value: 'platform', label: 'Platform' },
  { value: 'deviceModel', label: 'Device Model' },
  { value: 'locale', label: 'Locale' },
  { value: 'timezone', label: 'Timezone' },
] as const

const OPERATOR_OPTIONS = [
  { value: 'eq', label: 'equals' },
  { value: 'neq', label: 'not equals' },
  { value: 'gt', label: 'greater than' },
  { value: 'gte', label: 'greater or equal' },
  { value: 'lt', label: 'less than' },
  { value: 'lte', label: 'less or equal' },
  { value: 'semver_gt', label: 'version >' },
  { value: 'semver_gte', label: 'version >=' },
  { value: 'semver_lt', label: 'version <' },
  { value: 'semver_lte', label: 'version <=' },
  { value: 'contains', label: 'contains' },
  { value: 'starts_with', label: 'starts with' },
] as const

// =============================================================================
// Sub-Components
// =============================================================================

interface RuleRowProps {
  rule: ChannelTargetingRule
  index: number
  onChange: (index: number, rule: ChannelTargetingRule) => void
  onRemove: (index: number) => void
  disabled?: boolean
}

function RuleRow({ rule, index, onChange, onRemove, disabled }: RuleRowProps) {
  const handleFieldChange = (field: string) => {
    onChange(index, { ...rule, field })
  }

  const handleOperatorChange = (op: string) => {
    onChange(index, { ...rule, op })
  }

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(index, { ...rule, value: e.target.value })
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={rule.field} onValueChange={handleFieldChange} disabled={disabled}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Field" />
        </SelectTrigger>
        <SelectContent>
          {FIELD_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={rule.op} onValueChange={handleOperatorChange} disabled={disabled}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Operator" />
        </SelectTrigger>
        <SelectContent>
          {OPERATOR_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        value={typeof rule.value === 'string' ? rule.value : String(rule.value)}
        onChange={handleValueChange}
        placeholder="Value"
        disabled={disabled}
        className="flex-1"
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onRemove(index)}
        disabled={disabled}
      >
        <Trash2 className="w-4 h-4 text-neutral-400 hover:text-red-500" />
      </Button>
    </div>
  )
}

// =============================================================================
// Component
// =============================================================================

export function TargetingRules({ value, onChange, disabled }: TargetingRulesProps) {
  const rules = value?.rules ?? []
  const matchType = value?.match ?? 'all'

  const handleAddRule = () => {
    const newRule: ChannelTargetingRule = { field: 'appVersion', op: 'semver_gte', value: '' }
    onChange({ match: matchType, rules: [...rules, newRule] })
  }

  const handleRemoveRule = (index: number) => {
    const newRules = rules.filter((_, i) => i !== index)
    onChange(newRules.length > 0 ? { match: matchType, rules: newRules } : null)
  }

  const handleRuleChange = (index: number, updatedRule: ChannelTargetingRule) => {
    const newRules = rules.map((r, i) => (i === index ? updatedRule : r))
    onChange({ match: matchType, rules: newRules })
  }

  const handleMatchTypeChange = (newMatch: 'all' | 'any') => {
    if (rules.length > 0) {
      onChange({ match: newMatch, rules })
    }
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Targeting Rules</Label>
          {rules.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-neutral-500">Match</span>
              <Select
                value={matchType}
                onValueChange={(v) => handleMatchTypeChange(v as 'all' | 'any')}
                disabled={disabled}
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="any">Any</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-neutral-500">rules</span>
            </div>
          )}
        </div>

        {rules.length === 0 ? (
          <div className="text-center py-4 text-sm text-neutral-500">
            No targeting rules. All devices will receive updates.
          </div>
        ) : (
          <div className="space-y-2">
            {rules.map((rule, index) => (
              <RuleRow
                key={index}
                rule={rule}
                index={index}
                onChange={handleRuleChange}
                onRemove={handleRemoveRule}
                disabled={disabled}
              />
            ))}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddRule}
          disabled={disabled}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Rule
        </Button>
      </CardContent>
    </Card>
  )
}
