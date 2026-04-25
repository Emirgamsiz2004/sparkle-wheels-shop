import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Platin Automotive"

interface Props {
  naam?: string
}

const AanvraagOntvangen = ({ naam }: Props) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Aanvraag ontvangen — {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Aanvraag ontvangen</Heading>
        <Text style={text}>
          Beste {naam || 'klant'},
        </Text>
        <Text style={text}>
          We hebben uw aanvraag ontvangen en nemen binnen 1 uur contact met u op.
        </Text>
        <Text style={footer}>Met vriendelijke groet,<br />{SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: AanvraagOntvangen,
  subject: `Aanvraag ontvangen — ${SITE_NAME}`,
  displayName: 'Afspraak — aanvraag ontvangen',
  previewData: { naam: 'Jan de Vries' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '24px 28px' }
const h1 = { fontSize: '20px', fontWeight: '700' as const, color: '#0a0a0a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#555', lineHeight: '1.6', margin: '0 0 16px' }
const footer = { fontSize: '12px', color: '#999', margin: '24px 0 0' }
