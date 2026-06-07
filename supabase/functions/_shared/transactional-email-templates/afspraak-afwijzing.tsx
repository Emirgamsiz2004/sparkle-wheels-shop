import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, styles } from './_layout.tsx'
import { Text } from 'npm:@react-email/components@0.0.22'

const SITE_NAME = "Platin Automotive"

interface Props { naam?: string }

const Afwijzing = ({ naam }: Props) => (
  <EmailLayout
    preview={`Uw aanvraag bij ${SITE_NAME}`}
    eyebrow="Uw aanvraag"
    title="Helaas niet inplanbaar"
  >
    <Text style={styles.greeting}>Beste {naam || 'klant'},</Text>
    <Text style={styles.text}>
      Helaas kunnen we uw aanvraag op dit moment niet inplannen. Neem gerust contact met ons op
      via 071-781 25 25 om de mogelijkheden te bespreken — wij denken graag met u mee.
    </Text>
    <Text style={styles.text}>Met vriendelijke groet,<br />Team {SITE_NAME}</Text>
  </EmailLayout>
)

export const template = {
  component: Afwijzing,
  subject: `Uw aanvraag bij ${SITE_NAME}`,
  displayName: 'Afspraak — afwijzing',
  previewData: { naam: 'Jan de Vries' },
} satisfies TemplateEntry
