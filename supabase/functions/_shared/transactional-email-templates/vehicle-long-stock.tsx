import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, CtaButton, ButtonRow, styles } from './_layout.tsx'
import { Text } from 'npm:@react-email/components@0.0.22'

interface Props { merk?: string; model?: string; dagen?: number; link?: string }

const VehicleLongStockEmail: React.FC<Props> = ({ merk = '', model = '', dagen = 90, link = '' }) => (
  <EmailLayout
    preview={`${merk} ${model} staat al ${dagen} dagen te koop`}
    eyebrow="Voorraad signaal"
    title="Voertuig lang in voorraad"
  >
    <Text style={styles.text}>
      <strong>{merk} {model}</strong> staat al <strong>{dagen} dagen</strong> te koop.
      Overweeg actie te ondernemen (prijsherziening, promotie of nieuwe foto's).
    </Text>
    {link && (
      <ButtonRow>
        <CtaButton href={link} label="Bekijk voertuig" />
      </ButtonRow>
    )}
  </EmailLayout>
)

export const template = {
  component: VehicleLongStockEmail,
  subject: (d: any) => `Platin Automotive — ${d.merk} ${d.model} staat al ${d.dagen} dagen te koop`,
  displayName: 'Voertuig lang in voorraad',
  previewData: { merk: 'BMW', model: '320i', dagen: 90, link: 'https://example.com' },
} satisfies TemplateEntry
