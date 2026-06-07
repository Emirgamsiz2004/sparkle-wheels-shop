import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, InfoCard, DetailRow, styles } from './_layout.tsx'
import { Text, Hr } from 'npm:@react-email/components@0.0.22'

interface Props {
  isAanvraag?: boolean
  type?: string
  naam?: string
  email?: string
  telefoon?: string
  datum?: string
  tijdstip?: string
  voertuig?: string
  kenteken?: string
  omschrijving?: string
  voorkeursdatum?: string
  opmerking?: string
}

const AdminNotificatie = ({
  isAanvraag, type, naam, email, telefoon, datum, tijdstip,
  voertuig, kenteken, omschrijving, voorkeursdatum, opmerking,
}: Props) => {
  const title = isAanvraag ? 'Nieuwe aanvraag via website' : 'Nieuwe afspraak via website'
  return (
    <EmailLayout preview={title} eyebrow="Admin notificatie" title={title}>
      <Text style={styles.text}>Er is een nieuwe melding binnengekomen via de website.</Text>

      <InfoCard>
        <DetailRow label="Type" value={type || '-'} />
        <DetailRow label="Naam" value={naam || '-'} />
        <DetailRow label="E-mail" value={email || '-'} />
        <DetailRow label="Telefoon" value={telefoon || '-'} />

        {!isAanvraag && (
          <>
            <Hr style={{ borderColor: '#e8eaee', margin: '12px 0' }} />
            <DetailRow label="Datum" value={datum || '-'} />
            <DetailRow label="Tijdstip" value={tijdstip || '-'} />
            {voertuig && <DetailRow label="Voertuig" value={voertuig} />}
            {opmerking && <DetailRow label="Opmerking" value={opmerking} />}
          </>
        )}

        {isAanvraag && (
          <>
            <Hr style={{ borderColor: '#e8eaee', margin: '12px 0' }} />
            {kenteken && <DetailRow label="Kenteken" value={kenteken} />}
            {voorkeursdatum && <DetailRow label="Voorkeursdatum" value={voorkeursdatum} />}
            {omschrijving && <DetailRow label="Omschrijving" value={omschrijving} />}
          </>
        )}
      </InfoCard>

      <Text style={styles.small}>Bekijk en beheer in het admin-paneel onder Planning.</Text>
    </EmailLayout>
  )
}

export const template = {
  component: AdminNotificatie,
  subject: (data: Record<string, any>) =>
    data.isAanvraag
      ? `Nieuwe aanvraag via website — ${data.type || ''}`
      : `Nieuwe afspraak via website`,
  to: 'info@platinautomotive.nl',
  displayName: 'Afspraak — admin notificatie',
  previewData: {
    isAanvraag: false,
    type: 'Proefrit',
    naam: 'Jan de Vries',
    email: 'jan@voorbeeld.nl',
    telefoon: '06-12345678',
    datum: 'maandag 1 mei 2026',
    tijdstip: '10:00',
    voertuig: 'BMW 3 Serie (12-AB-34)',
  },
} satisfies TemplateEntry
