import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, styles } from './_layout.tsx'
import { Text } from 'npm:@react-email/components@0.0.22'

const SITE_NAME = "Platin Automotive"

interface Props { naam?: string }

const AanvraagOntvangen = ({ naam }: Props) => (
  <EmailLayout
    preview={`Aanvraag ontvangen — ${SITE_NAME}`}
    eyebrow="Aanvraag ontvangen"
    title="Bedankt voor uw aanvraag"
  >
    <Text style={styles.greeting}>Beste {naam || 'klant'},</Text>
    <Text style={styles.text}>
      We hebben uw aanvraag in goede orde ontvangen en nemen binnen 1 uur contact met u op
      om de details af te stemmen.
    </Text>
    <Text style={styles.text}>Met vriendelijke groet,<br />Team {SITE_NAME}</Text>
  </EmailLayout>
)

export const template = {
  component: AanvraagOntvangen,
  subject: `Aanvraag ontvangen — ${SITE_NAME}`,
  displayName: 'Afspraak — aanvraag ontvangen',
  previewData: { naam: 'Jan de Vries' },
} satisfies TemplateEntry
