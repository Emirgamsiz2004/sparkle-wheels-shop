import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, CtaButton, ButtonRow, styles } from './_layout.tsx'
import { Text, Section } from 'npm:@react-email/components@0.0.22'

interface Task { omschrijving: string; merk: string; model: string; deadline: string }
interface Props { tasks?: Task[]; link?: string }

const TasksOverdueEmail: React.FC<Props> = ({ tasks = [], link = '' }) => (
  <EmailLayout
    preview="Verlopen taken — Platin Automotive"
    eyebrow="Admin overzicht"
    title="Verlopen taken"
  >
    <Text style={styles.text}>
      {tasks.length} {tasks.length === 1 ? 'taak is' : 'taken zijn'} over de deadline:
    </Text>
    {tasks.map((t, i) => (
      <Section key={i} style={styles.listRow}>
        <Text style={{ fontSize: '14px', color: '#0a0a0a', margin: 0, fontWeight: 600 }}>{t.omschrijving}</Text>
        <Text style={{ fontSize: '12px', color: '#6d7079', margin: '4px 0 0' }}>
          {t.merk} {t.model} — deadline: {new Date(t.deadline).toLocaleDateString('nl-NL')}
        </Text>
      </Section>
    ))}
    {link && (
      <ButtonRow>
        <CtaButton href={link} label="Bekijk in admin" />
      </ButtonRow>
    )}
  </EmailLayout>
)

export const template = {
  component: TasksOverdueEmail,
  subject: (d: any) => `Platin Automotive — ${d.tasks?.length || 0} verlopen taken`,
  displayName: 'Verlopen taken overzicht',
  previewData: { tasks: [{ omschrijving: 'APK keuring', merk: 'BMW', model: '320i', deadline: '2026-04-01' }], link: 'https://example.com' },
} satisfies TemplateEntry
