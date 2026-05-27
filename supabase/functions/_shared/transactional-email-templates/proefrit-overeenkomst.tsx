import * as React from 'npm:react@18.3.1'
import {
  Html, Head, Body, Container, Text, Section, Row, Column, Hr, Img, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

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
  <Html>
    <Head />
    <Body style={{ backgroundColor: '#f4f4f4', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>
      <Container style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff' }}>
        {/* Header */}
        <Section style={{ backgroundColor: '#1a1a1a', padding: '30px 40px' }}>
          <Text style={{ color: '#ffffff', fontSize: '22px', fontWeight: '700', margin: 0, letterSpacing: '2px' }}>
            PLATIN AUTOMOTIVE
          </Text>
        </Section>

        {/* Content */}
        <Section style={{ padding: '40px' }}>
          <Text style={{ fontSize: '16px', color: '#1a1a1a', fontWeight: '600', marginBottom: '16px' }}>
            Beste {klantNaam},
          </Text>

          <Text style={{ fontSize: '14px', color: '#333', lineHeight: '1.6' }}>
            Bedankt voor uw proefrit bij Platin Automotive. Bijgevoegd vindt u de proefritovereenkomst
            als bewijs van de door u ondertekende overeenkomst.
          </Text>

          <Section style={{ backgroundColor: '#f8f8f8', borderRadius: '6px', padding: '20px', margin: '24px 0' }}>
            <Text style={{ fontSize: '13px', color: '#666', margin: '0 0 8px' }}>Voertuig</Text>
            <Text style={{ fontSize: '15px', color: '#1a1a1a', fontWeight: '600', margin: '0 0 12px' }}>
              {voertuig}{kenteken ? ` · ${kenteken}` : ''}
            </Text>
            <Text style={{ fontSize: '13px', color: '#666', margin: '0 0 4px' }}>Documentnummer</Text>
            <Text style={{ fontSize: '14px', color: '#1a1a1a', margin: '0 0 12px' }}>{documentNummer}</Text>
            <Text style={{ fontSize: '13px', color: '#666', margin: '0 0 4px' }}>Datum</Text>
            <Text style={{ fontSize: '14px', color: '#1a1a1a', margin: 0 }}>{datum}</Text>
          </Section>

          <Text style={{ fontSize: '14px', color: '#333', lineHeight: '1.6' }}>
            U kunt de overeenkomst bekijken en downloaden via onderstaande link:
          </Text>

          {pdfUrl && (
            <Section style={{ textAlign: 'center', margin: '24px 0' }}>
              <Link href={pdfUrl} style={{
                backgroundColor: '#1a1a1a',
                color: '#ffffff',
                padding: '12px 28px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '600',
                textDecoration: 'none',
                display: 'inline-block',
              }}>
                Overeenkomst bekijken
              </Link>
            </Section>
          )}

          <Text style={{ fontSize: '13px', color: '#888', lineHeight: '1.6', marginTop: '24px' }}>
            Dit is een automatisch gegenereerd bericht. Bewaar deze e-mail als bevestiging
            dat u een kopie van de proefritovereenkomst heeft ontvangen.
          </Text>
        </Section>

        {/* Footer */}
        <Section style={{ borderTop: '1px solid #eee', padding: '20px 40px' }}>
          <Text style={{ fontSize: '11px', color: '#999', textAlign: 'center', lineHeight: '1.6', margin: 0 }}>
            Platin Automotive · Cilinderweg 99 · 2371 DZ Roelofarendsveen{'\n'}
            071-781 25 25 · info@platinautomotive.nl · KvK 99146193
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
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
