import * as React from 'npm:react@18.3.1'
import {
  Html, Head, Body, Container, Text, Section, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

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
  <Html>
    <Head />
    <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>
      <Container style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff' }}>
        <Section style={{ backgroundColor: '#1a1a1a', padding: '30px 40px' }}>
          <Text style={{ color: '#ffffff', fontSize: '22px', fontWeight: 700, margin: 0, letterSpacing: '2px' }}>
            PLATIN AUTOMOTIVE
          </Text>
        </Section>

        <Section style={{ padding: '40px' }}>
          <Text style={{ fontSize: '16px', color: '#1a1a1a', fontWeight: 600, marginBottom: '16px' }}>
            Beste {klantNaam},
          </Text>

          <Text style={{ fontSize: '14px', color: '#333', lineHeight: '1.6' }}>
            Voordat wij de koopovereenkomst opmaken{voertuig ? ` voor de ${voertuig}${kenteken ? ` (${kenteken})` : ''}` : ''},
            ontvangt u hierbij een kopie van onze algemene voorwaarden.
          </Text>

          <Text style={{ fontSize: '14px', color: '#333', lineHeight: '1.6', marginTop: '12px' }}>
            Wij verzoeken u deze voorwaarden zorgvuldig door te lezen. Door ondertekening van de
            koopovereenkomst verklaart u deze algemene voorwaarden te hebben ontvangen, gelezen en
            hiermee akkoord te gaan.
          </Text>

          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Link
              href={voorwaardenUrl}
              style={{
                backgroundColor: '#1a1a1a',
                color: '#ffffff',
                padding: '12px 28px',
                borderRadius: '4px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 600,
                display: 'inline-block',
              }}
            >
              Algemene voorwaarden bekijken
            </Link>
          </Section>

          <Section style={{ backgroundColor: '#f8f8f8', borderRadius: '6px', padding: '16px 20px', margin: '8px 0' }}>
            <Text style={{ fontSize: '12px', color: '#666', margin: 0, lineHeight: '1.6' }}>
              U kunt de voorwaarden online inzien via bovenstaande knop of via:&nbsp;
              <Link href={voorwaardenUrl} style={{ color: '#1a1a1a' }}>{voorwaardenUrl}</Link>.
              Op verzoek sturen wij u een geprinte versie mee bij aflevering.
            </Text>
          </Section>

          <Text style={{ fontSize: '14px', color: '#333', lineHeight: '1.6', marginTop: '24px' }}>
            Heeft u vragen over de voorwaarden of de aankoop? Neem gerust contact met ons op via
            071-781 25 25 of info@platinautomotive.nl.
          </Text>

          <Text style={{ fontSize: '14px', color: '#333', marginTop: '24px' }}>
            Met vriendelijke groet,<br />
            Team Platin Automotive
          </Text>
        </Section>

        <Section style={{ backgroundColor: '#f4f4f4', padding: '20px 40px' }}>
          <Text style={{ fontSize: '12px', color: '#888', margin: 0, textAlign: 'center' }}>
            Platin Automotive · Cilinderweg 99, 2371 DZ Roelofarendsveen · KvK 99146193
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
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
