import * as React from 'npm:react@18.3.1'
import { Html, Head, Body, Container, Text, Section, Button } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props { merk?: string; model?: string; dagen?: number; link?: string }

const VehicleLongStockEmail: React.FC<Props> = ({ merk = '', model = '', dagen = 90, link = '' }) => (
  <Html>
    <Head />
    <Body style={main}>
      <Container style={container}>
        <Section style={header}><Text style={headerText}>Platin Automotive</Text></Section>
        <Section style={{ padding: '30px 40px' }}>
          <Text style={h1}>Voertuig lang in voorraad</Text>
          <Text style={text}><strong>{merk} {model}</strong> staat al {dagen} dagen te koop. Overweeg actie te ondernemen.</Text>
          {link && <Button href={link} style={btn}>Bekijk voertuig</Button>}
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: VehicleLongStockEmail,
  subject: (d: any) => `Platin Automotive — ${d.merk} ${d.model} staat al ${d.dagen} dagen te koop`,
  displayName: 'Voertuig lang in voorraad',
  previewData: { merk: 'BMW', model: '320i', dagen: 90, link: 'https://example.com' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { maxWidth: '600px', margin: '0 auto' }
const header = { backgroundColor: '#1a1a1a', padding: '25px 40px' }
const headerText = { color: '#ffffff', fontSize: '18px', fontWeight: '700' as const, margin: '0', letterSpacing: '2px' }
const h1 = { fontSize: '20px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 15px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 20px' }
const btn = { backgroundColor: '#1a1a1a', color: '#ffffff', padding: '10px 24px', fontSize: '13px', fontWeight: '600' as const, textDecoration: 'none', borderRadius: '3px' }
