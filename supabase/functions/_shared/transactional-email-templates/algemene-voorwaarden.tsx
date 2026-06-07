import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, InfoCard, DetailRow, CtaButton, ButtonRow, styles } from './_layout.tsx'
import { Text } from 'npm:@react-email/components@0.0.22'

interface Props {
  klantNaam?: string
  voertuig?: string
  kenteken?: string
  voorwaardenUrl?: string
}

const AlgemeneVoorwaardenEmail: React.FC<Props> = ({
  klantNaam = 'Klant',
  voertuig = '',
  kenteken = '',
  voorwaardenUrl = 'https://platinautomotive.nl/algemene-voorwaarden',
}) => (
  <EmailLayout
    preview="Algemene voorwaarden Platin Automotive"
    eyebrow="Voor uw aankoop"
    title="Onze algemene voorwaarden"
  >
    <Text style={styles.greeting}>Beste {klantNaam},</Text>
    <Text style={styles.text}>
      Voordat wij de koopovereenkomst opmaken
      {voertuig ? ` voor de ${voertuig}${kenteken ? ` (${kenteken})` : ''}` : ''},
      ontvangt u hierbij een kopie van onze algemene voorwaarden.
    </Text>
    <Text style={styles.text}>
      Wij verzoeken u deze voorwaarden zorgvuldig door te lezen. Door ondertekening van de
      koopovereenkomst verklaart u deze algemene voorwaarden te hebben ontvangen, gelezen en hiermee akkoord te gaan.
    </Text>

    <ButtonRow>
      <CtaButton href={voorwaardenUrl} label="Algemene voorwaarden bekijken" />
    </ButtonRow>

    <InfoCard>
      <Text style={{ ...styles.small, margin: 0 }}>
        U kunt de voorwaarden online inzien via bovenstaande knop of via{' '}
        <a href={voorwaardenUrl} style={{ color: '#0a0a0a', fontWeight: 600 }}>{voorwaardenUrl}</a>.
        Op verzoek sturen wij u een geprinte versie mee bij aflevering.
      </Text>
    </InfoCard>

    <Text style={styles.text}>
      Heeft u vragen over de voorwaarden of de aankoop? Neem gerust contact met ons op via
      071-781 25 25 of info@platinautomotive.nl.
    </Text>
    <Text style={styles.text}>Met vriendelijke groet,<br />Team Platin Automotive</Text>
  </EmailLayout>
)

export const template = {
  component: AlgemeneVoorwaardenEmail,
  subject: 'Algemene voorwaarden — Platin Automotive',
  displayName: 'Algemene voorwaarden',
  previewData: {
    klantNaam: 'Jan Jansen',
    voertuig: 'Volkswagen Polo 2012',
    kenteken: '10-SZL-1',
    voorwaardenUrl: 'https://platinautomotive.nl/algemene-voorwaarden',
  },
} satisfies TemplateEntry
