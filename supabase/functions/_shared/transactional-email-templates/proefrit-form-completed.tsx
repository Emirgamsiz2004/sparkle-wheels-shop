import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, CtaButton, ButtonRow, styles } from './_layout.tsx'
import { Text } from 'npm:@react-email/components@0.0.22'

interface Props { klantNaam?: string; voertuig?: string; link?: string }

const ProefritFormCompletedEmail: React.FC<Props> = ({ klantNaam = 'Klant', voertuig = '', link = '' }) => (
  <EmailLayout
    preview="Proefrit formulier ingevuld"
    eyebrow="Admin notificatie"
    title="Proefrit formulier ingevuld"
  >
    <Text style={styles.text}>
      <strong>{klantNaam}</strong> heeft het proefritformulier ingevuld voor <strong>{voertuig}</strong>.
    </Text>
    {link && (
      <ButtonRow>
        <CtaButton href={link} label="Bekijk proefrit" />
      </ButtonRow>
    )}
  </EmailLayout>
)

export const template = {
  component: ProefritFormCompletedEmail,
  subject: (d: any) => `Platin Automotive — Proefrit formulier ingevuld door ${d.klantNaam}`,
  displayName: 'Proefrit formulier ingevuld',
  previewData: { klantNaam: 'Jan de Vries', voertuig: 'BMW 320i', link: 'https://example.com' },
} satisfies TemplateEntry
