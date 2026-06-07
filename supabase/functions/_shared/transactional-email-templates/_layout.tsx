// Shared premium email layout for Platin Automotive
// Modern, industrial-dark look with silver accents.
import * as React from 'npm:react@18.3.1'
import {
  Html, Head, Body, Container, Section, Text, Link, Hr, Row, Column,
} from 'npm:@react-email/components@0.0.22'

export const BRAND = {
  name: 'PLATIN AUTOMOTIVE',
  tagline: 'Premium occasions · Detailing · Customizing',
  adres: 'Cilinderweg 99, 2371 DZ Roelofarendsveen',
  tel: '071-781 25 25',
  email: 'info@platinautomotive.nl',
  site: 'platinautomotive.nl',
  kvk: 'KvK 99146193',
}

// ---------- shared styles ----------
const FONT_HEAD = "'Helvetica Neue', Helvetica, Arial, sans-serif"
const FONT_BODY = "'Helvetica Neue', Helvetica, Arial, sans-serif"

export const styles = {
  main: {
    backgroundColor: '#ffffff',
    margin: 0,
    padding: '0',
    fontFamily: FONT_BODY,
    color: '#1a1a1a',
    WebkitFontSmoothing: 'antialiased' as const,
  },
  pageWrap: {
    backgroundColor: '#eef0f3',
    padding: '32px 12px',
  },
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    overflow: 'hidden' as const,
    boxShadow: '0 4px 24px rgba(15, 17, 21, 0.08)',
  },
  headerBand: {
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1f2226 55%, #2a2d31 100%)',
    padding: '32px 40px 28px',
    borderBottom: '1px solid #2a2d31',
  },
  brandMark: {
    color: '#f3f4f6',
    fontSize: '22px',
    fontWeight: 800 as const,
    margin: 0,
    letterSpacing: '0.32em',
    fontFamily: FONT_HEAD,
  },
  brandRule: {
    display: 'inline-block' as const,
    width: '44px',
    height: '2px',
    background: 'linear-gradient(90deg, #b8bcc4, #6d7079)',
    margin: '12px 0 8px',
    borderRadius: '2px',
  },
  brandTagline: {
    color: '#b8bcc4',
    fontSize: '11px',
    margin: 0,
    letterSpacing: '0.18em',
    textTransform: 'uppercase' as const,
    fontWeight: 500 as const,
  },
  content: {
    padding: '36px 40px 8px',
  },
  eyebrow: {
    fontSize: '11px',
    color: '#6d7079',
    letterSpacing: '0.18em',
    textTransform: 'uppercase' as const,
    fontWeight: 600 as const,
    margin: '0 0 10px',
  },
  h1: {
    fontSize: '24px',
    fontWeight: 700 as const,
    color: '#0a0a0a',
    margin: '0 0 18px',
    letterSpacing: '-0.01em',
    lineHeight: 1.25,
    fontFamily: FONT_HEAD,
  },
  greeting: {
    fontSize: '15px',
    fontWeight: 600 as const,
    color: '#0a0a0a',
    margin: '0 0 14px',
  },
  text: {
    fontSize: '14px',
    color: '#3a3d44',
    lineHeight: 1.65,
    margin: '0 0 14px',
  },
  small: {
    fontSize: '12px',
    color: '#6d7079',
    lineHeight: 1.6,
    margin: '0 0 8px',
  },
  divider: {
    borderColor: '#e8eaee',
    margin: '28px 0',
  },
  // info card
  card: {
    backgroundColor: '#f6f7f9',
    borderLeft: '3px solid #2a2d31',
    borderRadius: '6px',
    padding: '18px 22px',
    margin: '20px 0 24px',
  },
  detailLabel: {
    fontSize: '10px',
    color: '#6d7079',
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    fontWeight: 600 as const,
    margin: '8px 0 2px',
  },
  detailValue: {
    fontSize: '14px',
    color: '#0a0a0a',
    fontWeight: 500 as const,
    margin: '0 0 6px',
    lineHeight: 1.5,
  },
  // buttons
  btnPrimary: {
    background: 'linear-gradient(180deg, #1f2226 0%, #0a0a0a 100%)',
    color: '#ffffff',
    padding: '13px 26px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600 as const,
    textDecoration: 'none' as const,
    display: 'inline-block' as const,
    letterSpacing: '0.04em',
    border: '1px solid #0a0a0a',
  },
  btnSecondary: {
    backgroundColor: '#ffffff',
    color: '#0a0a0a',
    padding: '12px 26px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600 as const,
    textDecoration: 'none' as const,
    display: 'inline-block' as const,
    letterSpacing: '0.04em',
    border: '1px solid #0a0a0a',
  },
  ctaWrap: {
    textAlign: 'center' as const,
    margin: '8px 0 24px',
  },
  // listing row
  listRow: {
    backgroundColor: '#f6f7f9',
    borderRadius: '6px',
    padding: '14px 18px',
    marginBottom: '8px',
    borderLeft: '3px solid #2a2d31',
  },
  // footer
  footerBand: {
    backgroundColor: '#0a0a0a',
    padding: '24px 40px',
    marginTop: '24px',
  },
  footerBrand: {
    color: '#f3f4f6',
    fontSize: '12px',
    fontWeight: 700 as const,
    letterSpacing: '0.24em',
    margin: '0 0 8px',
  },
  footerLine: {
    color: '#b8bcc4',
    fontSize: '11px',
    lineHeight: 1.7,
    margin: 0,
  },
  footerLink: {
    color: '#f3f4f6',
    textDecoration: 'none' as const,
  },
  noteBox: {
    backgroundColor: '#fafbfc',
    border: '1px solid #e8eaee',
    borderRadius: '6px',
    padding: '14px 18px',
    margin: '16px 0',
  },
}

// ---------- Layout component ----------
interface LayoutProps {
  preview?: string
  eyebrow?: string
  title?: string
  children: React.ReactNode
  showTagline?: boolean
}

export const EmailLayout: React.FC<LayoutProps> = ({
  preview,
  eyebrow,
  title,
  children,
  showTagline = true,
}) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Body style={styles.main}>
      {preview ? (
        <span style={{ display: 'none', overflow: 'hidden', lineHeight: '1px', opacity: 0, maxHeight: 0, maxWidth: 0 }}>
          {preview}
        </span>
      ) : null}
      <Section style={styles.pageWrap}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.headerBand}>
            <Text style={styles.brandMark}>{BRAND.name}</Text>
            <div style={styles.brandRule} />
            {showTagline && <Text style={styles.brandTagline}>{BRAND.tagline}</Text>}
          </Section>

          {/* Content */}
          <Section style={styles.content}>
            {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
            {title ? <Text style={styles.h1}>{title}</Text> : null}
            {children}
          </Section>

          {/* Footer */}
          <Section style={styles.footerBand}>
            <Text style={styles.footerBrand}>{BRAND.name}</Text>
            <Text style={styles.footerLine}>
              {BRAND.adres}<br />
              <Link href={`tel:${BRAND.tel.replace(/[^0-9+]/g, '')}`} style={styles.footerLink}>{BRAND.tel}</Link>
              {' · '}
              <Link href={`mailto:${BRAND.email}`} style={styles.footerLink}>{BRAND.email}</Link>
              {' · '}
              <Link href={`https://${BRAND.site}`} style={styles.footerLink}>{BRAND.site}</Link>
              <br />
              {BRAND.kvk}
            </Text>
          </Section>
        </Container>
      </Section>
    </Body>
  </Html>
)

// ---------- Helpers ----------
interface DetailRowProps { label: string; value?: React.ReactNode }
export const DetailRow: React.FC<DetailRowProps> = ({ label, value }) => (
  <>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value || '-'}</Text>
  </>
)

interface InfoCardProps { children: React.ReactNode }
export const InfoCard: React.FC<InfoCardProps> = ({ children }) => (
  <Section style={styles.card}>{children}</Section>
)

interface CtaButtonProps { href: string; label: string; variant?: 'primary' | 'secondary' }
export const CtaButton: React.FC<CtaButtonProps> = ({ href, label, variant = 'primary' }) => (
  <Link href={href} style={variant === 'primary' ? styles.btnPrimary : styles.btnSecondary}>{label}</Link>
)

export const ButtonRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Section style={styles.ctaWrap}>{children}</Section>
)

export { Hr, Row, Column, Text, Section, Link }
