import * as React from 'npm:react@18.3.1'
import { Html, Head, Body, Container, Text, Section, Hr, Button } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Task { omschrijving: string; merk: string; model: string; deadline: string }
interface Props { tasks?: Task[]; link?: string }

const TasksOverdueEmail: React.FC<Props> = ({ tasks = [], link = '' }) => (
  <Html>
    <Head />
    <Body style={main}>
      <Container style={container}>
        <Section style={header}><Text style={headerText}>Platin Automotive</Text></Section>
        <Section style={{ padding: '30px 40px' }}>
          <Text style={h1}>Verlopen taken</Text>
          <Text style={text}>{tasks.length} {tasks.length === 1 ? 'taak is' : 'taken zijn'} over de deadline:</Text>
          {tasks.map((t, i) => (
            <Section key={i} style={row}>
              <Text style={rowText}><strong>{t.omschrijving}</strong></Text>
              <Text style={rowSub}>{t.merk} {t.model} — deadline: {new Date(t.deadline).toLocaleDateString('nl-NL')}</Text>
            </Section>
          ))}
          <Hr style={hr} />
          {link && <Button href={link} style={btn}>Bekijk in admin</Button>}
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: TasksOverdueEmail,
  subject: (d: any) => `Platin Automotive — ${d.tasks?.length || 0} verlopen taken`,
  displayName: 'Verlopen taken overzicht',
  previewData: { tasks: [{ omschrijving: 'APK keuring', merk: 'BMW', model: '320i', deadline: '2026-04-01' }], link: 'https://example.com' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { maxWidth: '600px', margin: '0 auto' }
const header = { backgroundColor: '#1a1a1a', padding: '25px 40px' }
const headerText = { color: '#ffffff', fontSize: '18px', fontWeight: '700' as const, margin: '0', letterSpacing: '2px' }
const h1 = { fontSize: '20px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 15px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 20px' }
const row = { backgroundColor: '#f8f8f8', padding: '12px 16px', marginBottom: '8px', borderRadius: '4px' }
const rowText = { fontSize: '14px', color: '#1a1a1a', margin: '0' }
const rowSub = { fontSize: '12px', color: '#888', margin: '4px 0 0' }
const hr = { borderColor: '#eee', margin: '20px 0' }
const btn = { backgroundColor: '#1a1a1a', color: '#ffffff', padding: '10px 24px', fontSize: '13px', fontWeight: '600' as const, textDecoration: 'none', borderRadius: '3px' }
