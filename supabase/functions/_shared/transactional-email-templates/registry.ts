/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as proefritOvereenkomst } from './proefrit-overeenkomst.tsx'
import { template as apkOverview } from './apk-overview.tsx'
import { template as vehicleLongStock } from './vehicle-long-stock.tsx'
import { template as proefritFormCompleted } from './proefrit-form-completed.tsx'
import { template as tasksOverdueOverview } from './tasks-overdue-overview.tsx'
import { template as nieuweContactAanmelding } from './nieuwe-contact-aanmelding.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'proefrit-overeenkomst': proefritOvereenkomst,
  'apk-overview': apkOverview,
  'vehicle-long-stock': vehicleLongStock,
  'proefrit-form-completed': proefritFormCompleted,
  'tasks-overdue-overview': tasksOverdueOverview,
  'nieuwe-contact-aanmelding': nieuweContactAanmelding,
}
