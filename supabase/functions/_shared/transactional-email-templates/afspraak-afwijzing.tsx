import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Platin Automotive"

interface Props { naam?: string }

const Afwijzing = ({ naam }: Props) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Uw aanvraag bij {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Uw aanvraag</Heading>
        <Text style={text}>Beste {naam || 'klant'},</Text>
        <Text style={text}>
          Helaas kunnen we uw aanvraag op dit moment niet inplannen. Neem gerust
          contact met ons op via 06-12693825 om de mogelijkheden te bespreken.
        </Text>
        <Text style={footer}>Met vriendelijke groet,<br />{SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Afwijzing,
  subject: `Uw aanvraag bij ${SITE_NAME}`,
  displayName: 'Afspraak — afwijzing',
  previewData: { naam: 'Jan de Vries' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '24px 28px' }
const h1 = { fontSize: '20px', fontWeight: '700' as const, color: '#0a0a0a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#555', lineHeight: '1.6', margin: '0 0 16px' }
const footer = { fontSize: '12px', color: '#999', margin: '24px 0 0' }
