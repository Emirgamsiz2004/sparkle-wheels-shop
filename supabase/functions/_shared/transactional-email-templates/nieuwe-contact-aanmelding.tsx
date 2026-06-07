import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, InfoCard, DetailRow, styles } from './_layout.tsx'
import { Text, Hr } from 'npm:@react-email/components@0.0.22'

interface Props {
  type?: string
  naam?: string
  email?: string
  telefoon?: string
  bericht?: string
  merk?: string
  model?: string
  bouwjaar?: string
  kenteken?: string
}

const NieuweAanmeldingEmail = ({ type, naam, email, telefoon, bericht, merk, model, bouwjaar, kenteken }: Props) => {
  const isConsignatie = type === 'consignatie'
  const title = isConsignatie ? 'Nieuwe consignatie-aanmelding' : 'Nieuw contactformulier'

  return (
    <EmailLayout preview={`${title} van ${naam || 'onbekend'}`} eyebrow="Admin notificatie" title={title}>
      <Text style={styles.text}>Er is een nieuwe aanmelding binnengekomen via de website.</Text>

      <InfoCard>
        <DetailRow label="Naam" value={naam || '-'} />
        <DetailRow label="E-mail" value={email || '-'} />
        <DetailRow label="Telefoon" value={telefoon || '-'} />

        {isConsignatie && (
          <>
            <Hr style={{ borderColor: '#e8eaee', margin: '12px 0' }} />
            {merk && <DetailRow label="Merk" value={merk} />}
            {model && <DetailRow label="Model" value={model} />}
            {bouwjaar && <DetailRow label="Bouwjaar" value={bouwjaar} />}
            {kenteken && <DetailRow label="Kenteken" value={kenteken} />}
          </>
        )}

        {bericht && (
          <>
            <Hr style={{ borderColor: '#e8eaee', margin: '12px 0' }} />
            <DetailRow label="Bericht" value={bericht} />
          </>
        )}
      </InfoCard>

      <Text style={styles.small}>
        Bekijk alle aanmeldingen in het admin-paneel onder "Aanmeldingen".
      </Text>
    </EmailLayout>
  )
}

export const template = {
  component: NieuweAanmeldingEmail,
  subject: (data: Record<string, any>) =>
    data.type === 'consignatie'
      ? `Nieuwe consignatie-aanmelding: ${data.merk || ''} ${data.model || ''}`
      : `Nieuw contactformulier: ${data.naam || 'onbekend'}`,
  displayName: 'Nieuwe aanmelding notificatie',
  to: 'info@platinautomotive.nl',
  previewData: {
    type: 'contact',
    naam: 'Jan de Vries',
    email: 'jan@voorbeeld.nl',
    telefoon: '06-12345678',
    bericht: 'Ik ben geïnteresseerd in de BMW 3 Serie.',
  },
} satisfies TemplateEntry
