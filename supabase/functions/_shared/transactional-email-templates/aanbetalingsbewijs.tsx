import * as React from 'npm:react@18.3.1'
import {
  Html, Head, Body, Container, Text, Section, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

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
            Wij hebben uw aanbetaling in goede orde ontvangen. Bij deze e-mail ontvangt u uw aanbetalingsbewijs.
            Het voertuig is voor u gereserveerd.
          </Text>

          <Section style={{ backgroundColor: '#f8f8f8', borderRadius: '6px', padding: '20px', margin: '24px 0' }}>
            <Text style={{ fontSize: '13px', color: '#666', margin: '0 0 4px' }}>Voertuig</Text>
            <Text style={{ fontSize: '15px', color: '#1a1a1a', fontWeight: 600, margin: '0 0 12px' }}>
              {voertuig}{kenteken ? ` · ${kenteken}` : ''}
            </Text>
            <Text style={{ fontSize: '13px', color: '#666', margin: '0 0 4px' }}>Aanbetalingsbedrag</Text>
            <Text style={{ fontSize: '15px', color: '#1a1a1a', fontWeight: 600, margin: '0 0 12px' }}>{bedrag}</Text>
            <Text style={{ fontSize: '13px', color: '#666', margin: '0 0 4px' }}>Ontvangen op</Text>
            <Text style={{ fontSize: '14px', color: '#1a1a1a', margin: 0 }}>{datum}</Text>
          </Section>

          {pdfUrl ? (
            <>
              <Text style={{ fontSize: '14px', color: '#333', lineHeight: '1.6' }}>
                U kunt uw aanbetalingsbewijs hieronder bekijken en downloaden:
              </Text>
              <Section style={{ textAlign: 'center', margin: '24px 0' }}>
                <Link
                  href={pdfUrl}
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
                  Aanbetalingsbewijs downloaden
                </Link>
              </Section>
            </>
          ) : null}

          <Text style={{ fontSize: '14px', color: '#333', lineHeight: '1.6', marginTop: '24px' }}>
            Heeft u vragen? Neem gerust contact met ons op.
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
