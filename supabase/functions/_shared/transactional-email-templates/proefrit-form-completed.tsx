import * as React from 'npm:react@18.3.1'
import { Html, Head, Body, Container, Text, Section, Button } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props { klantNaam?: string; voertuig?: string; link?: string }

const ProefritFormCompletedEmail: React.FC<Props> = ({ klantNaam = 'Klant', voertuig = '', link = '' }) => (
  <Html>
    <Head />
    <Body style={main}>
      <Container style={container}>
        <Section style={header}><Text style={headerText}>Platin Automotive</Text></Section>
        <Section style={{ padding: '30px 40px' }}>
          <Text style={h1}>Proefrit formulier ingevuld</Text>
          <Text style={text}><strong>{klantNaam}</strong> heeft het proefrit formulier ingevuld voor <strong>{voertuig}</strong>.</Text>
          {link && <Button href={link} style={btn}>Bekijk proefrit</Button>}
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ProefritFormCompletedEmail,
  subject: (d: any) => `Platin Automotive — Proefrit formulier ingevuld door ${d.klantNaam}`,
  displayName: 'Proefrit formulier ingevuld',
  previewData: { klantNaam: 'Jan de Vries', voertuig: 'BMW 320i', link: 'https://example.com' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { maxWidth: '600px', margin: '0 auto' }
const header = { backgroundColor: '#1a1a1a', padding: '25px 40px' }
const headerText = { color: '#ffffff', fontSize: '18px', fontWeight: '700' as const, margin: '0', letterSpacing: '2px' }
const h1 = { fontSize: '20px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 15px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 20px' }
const btn = { backgroundColor: '#1a1a1a', color: '#ffffff', padding: '10px 24px', fontSize: '13px', fontWeight: '600' as const, textDecoration: 'none', borderRadius: '3px' }
