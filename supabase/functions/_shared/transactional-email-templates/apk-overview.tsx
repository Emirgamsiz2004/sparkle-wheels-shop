import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, CtaButton, ButtonRow, styles } from './_layout.tsx'
import { Text, Section } from 'npm:@react-email/components@0.0.22'

interface Vehicle { merk: string; model: string; kenteken: string; datum: string }
interface Props { vehicles?: Vehicle[]; link?: string }

const ApkOverviewEmail: React.FC<Props> = ({ vehicles = [], link = '' }) => (
  <EmailLayout
    preview="APK Overzicht — Platin Automotive"
    eyebrow="Admin overzicht"
    title="APK Overzicht"
  >
    <Text style={styles.text}>De volgende voertuigen hebben aandacht nodig:</Text>
    {vehicles.map((v, i) => (
      <Section key={i} style={styles.listRow}>
        <Text style={{ fontSize: '14px', color: '#0a0a0a', margin: 0, fontWeight: 600 }}>
          {v.merk} {v.model} <span style={{ color: '#6d7079', fontWeight: 400 }}>({v.kenteken})</span>
        </Text>
        <Text style={{ fontSize: '12px', color: '#6d7079', margin: '4px 0 0' }}>
          APK: {new Date(v.datum).toLocaleDateString('nl-NL')}
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
  component: ApkOverviewEmail,
  subject: 'Platin Automotive — APK overzicht',
  displayName: 'APK Overzicht',
  previewData: { vehicles: [{ merk: 'BMW', model: '320i', kenteken: 'AB-123-CD', datum: '2026-05-01' }], link: 'https://example.com' },
} satisfies TemplateEntry
