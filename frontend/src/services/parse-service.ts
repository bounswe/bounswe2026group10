import { httpClient } from '@/lib/http-client'

export interface ParsedIngredient {
  name: string
  quantity: number | null
  unit: string
}

export interface ParsedStep {
  stepOrder: number
  description: string
}

export interface ParsedRecipeOutput {
  title: string
  ingredients: ParsedIngredient[]
  steps: ParsedStep[]
  tools: string[]
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function normalizeStep(raw: unknown, fallbackOrder: number): ParsedStep | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  const description = typeof row.description === 'string' ? row.description.trim() : ''
  if (!description) return null
  const stepOrder = toNumber(row.stepOrder) ?? fallbackOrder
  return {
    stepOrder,
    description,
  }
}

function normalizeIngredient(raw: unknown): ParsedIngredient | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  const name = typeof row.name === 'string' ? row.name.trim() : ''
  if (!name) return null
  const quantity = toNumber(row.quantity)
  const unit = typeof row.unit === 'string' ? row.unit.trim() : ''
  return {
    name,
    quantity,
    unit,
  }
}

function normalizeTool(raw: unknown): string | null {
  if (typeof raw === 'string') {
    const text = raw.trim()
    return text || null
  }
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  const name = typeof row.name === 'string' ? row.name.trim() : ''
  return name || null
}

export const parseService = {
  parseRecipeText: async (text: string): Promise<ParsedRecipeOutput> => {
    const res = await httpClient.post('/parse/recipe-text', { text })
    const payload = (res.data?.data ?? {}) as Record<string, unknown>

    const title = typeof payload.title === 'string' ? payload.title.trim() : ''

    const rawIngredients = Array.isArray(payload.ingredients) ? payload.ingredients : []
    const rawSteps = Array.isArray(payload.steps) ? payload.steps : []
    const rawTools = Array.isArray(payload.tools) ? payload.tools : []

    const ingredients = rawIngredients
      .map(normalizeIngredient)
      .filter((row): row is ParsedIngredient => row !== null)

    const steps = rawSteps
      .map((row, idx) => normalizeStep(row, idx + 1))
      .filter((row): row is ParsedStep => row !== null)
      .sort((a, b) => a.stepOrder - b.stepOrder)

    const tools = rawTools
      .map(normalizeTool)
      .filter((row): row is string => row !== null)

    return {
      title,
      ingredients,
      steps,
      tools,
    }
  },
}
