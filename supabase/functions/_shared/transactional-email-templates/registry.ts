import type { FC } from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: FC<any>
  subject: string | ((data: any) => string)
  displayName?: string
  previewData?: Record<string, any>
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {}

// Import and register templates
import { template as proefritOvereenkomst } from './proefrit-overeenkomst.tsx'
TEMPLATES['proefrit-overeenkomst'] = proefritOvereenkomst
