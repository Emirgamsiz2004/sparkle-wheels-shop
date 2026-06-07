import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, InfoCard, DetailRow, CtaButton, ButtonRow, styles } from './_layout.tsx'
import { Text } from 'npm:@react-email/components@0.0.22'

interface Props {
  klantNaam?: string
  voertuig?: string
  kenteken?: string
  bedrag?: string
  datum?: string
  pdfUrl?: string
}

const AanbetalingsbewijsEmail: React.FC<Props> = ({
  klantNaam = 'Klant',
  voertuig = '',
  kenteken = '',
  bedrag = '',
  datum = '',
  pdfUrl = '',
}) => (
  <EmailLayout
    preview="Bevestiging van uw aanbetaling — Platin Automotive"
    eyebrow="Aanbetaling ontvangen"
    title="Uw voertuig is gereserveerd"
  >
    <Text style={styles.greeting}>Beste {klantNaam},</Text>
    <Text style={styles.text}>
      Wij hebben uw aanbetaling in goede orde ontvangen. Hierbij ontvangt u uw aanbetalingsbewijs.
      Het voertuig is voor u gereserveerd.
    </Text>

    <InfoCard>
      <DetailRow label="Voertuig" value={`${voertuig}${kenteken ? ` · ${kenteken}` : ''}`} />
      <DetailRow label="Aanbetalingsbedrag" value={bedrag} />
      <DetailRow label="Ontvangen op" value={datum} />
    </InfoCard>

    {pdfUrl ? (
      <>
        <Text style={styles.text}>U kunt uw aanbetalingsbewijs hieronder bekijken en downloaden:</Text>
        <ButtonRow>
          <CtaButton href={pdfUrl} label="Aanbetalingsbewijs downloaden" />
        </ButtonRow>
      </>
    ) : null}

    <Text style={styles.text}>Heeft u vragen? Neem gerust contact met ons op.</Text>
    <Text style={styles.text}>Met vriendelijke groet,<br />Team Platin Automotive</Text>
  </EmailLayout>
)

export const template = {
  component: AanbetalingsbewijsEmail,
  subject: 'Bevestiging aanbetaling — Platin Automotive',
  displayName: 'Aanbetalingsbewijs',
  previewData: {
    klantNaam: 'Jan Jansen',
    voertuig: 'Volkswagen Polo 2012',
    kenteken: '10-SZL-1',
    bedrag: '€ 500,00',
    datum: '02-05-2026',
    pdfUrl: 'https://example.com/bewijs.pdf',
  },
} satisfies TemplateEntry
