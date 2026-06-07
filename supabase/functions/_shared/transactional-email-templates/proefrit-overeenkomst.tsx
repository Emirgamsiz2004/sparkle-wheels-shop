import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, InfoCard, DetailRow, CtaButton, ButtonRow, styles } from './_layout.tsx'
import { Text } from 'npm:@react-email/components@0.0.22'

interface Props {
  klantNaam?: string
  voertuig?: string
  kenteken?: string
  datum?: string
  documentNummer?: string
  pdfUrl?: string
}

const ProefritOvereenkomstEmail: React.FC<Props> = ({
  klantNaam = 'Klant',
  voertuig = '',
  kenteken = '',
  datum = '',
  documentNummer = '',
  pdfUrl = '',
}) => (
  <EmailLayout
    preview="Uw proefritovereenkomst — Platin Automotive"
    eyebrow="Proefritovereenkomst"
    title="Bedankt voor uw proefrit"
  >
    <Text style={styles.greeting}>Beste {klantNaam},</Text>
    <Text style={styles.text}>
      Bedankt voor uw proefrit bij Platin Automotive. Hierbij ontvangt u de proefritovereenkomst
      als bewijs van de door u ondertekende overeenkomst.
    </Text>

    <InfoCard>
      <DetailRow label="Voertuig" value={`${voertuig}${kenteken ? ` · ${kenteken}` : ''}`} />
      <DetailRow label="Documentnummer" value={documentNummer} />
      <DetailRow label="Datum" value={datum} />
    </InfoCard>

    {pdfUrl && (
      <>
        <Text style={styles.text}>U kunt de overeenkomst bekijken en downloaden via onderstaande knop:</Text>
        <ButtonRow>
          <CtaButton href={pdfUrl} label="Overeenkomst bekijken" />
        </ButtonRow>
      </>
    )}

    <Text style={styles.small}>
      Dit is een automatisch gegenereerd bericht. Bewaar deze e-mail als bevestiging dat u
      een kopie van de proefritovereenkomst heeft ontvangen.
    </Text>
  </EmailLayout>
)

export const template: TemplateEntry = {
  component: ProefritOvereenkomstEmail,
  subject: (data: Props) => `Proefritovereenkomst ${data.voertuig || ''} — ${data.documentNummer || ''}`,
  displayName: 'Proefrit Overeenkomst',
  previewData: {
    klantNaam: 'Jan de Vries',
    voertuig: 'Mercedes-Benz C 220d AMG Line',
    kenteken: 'XY-456-Z',
    datum: '26 maart 2026',
    documentNummer: 'PR-2026-0002',
    pdfUrl: 'https://platinautomotive.nl',
  },
}
