import hoodBrandTableIcon from '@/assets/hood-brand-table-icon.png';
import hoodDigitalAssetsIcon from '@/assets/hood-digital-assets-icon.png';
import hoodPadbIcon from '@/assets/hood-padb-icon.png';
import hoodPcdbIcon from '@/assets/hood-pcdb-icon.png';
import hoodQdbIcon from '@/assets/hood-qdb-icon.png';
import hoodVcdbIcon from '@/assets/hood-vcdb-icon.png';

export type StandardsDatabaseIcon = {
  id: string;
  label: string;
  src: string;
};

type StandardsDatabaseIconDefinition = StandardsDatabaseIcon & {
  matches: (subscriptionProductName: string) => boolean;
};

/** Maps Standards Subscriber sheet values to badge icons (deduped by database family). */
const STANDARDS_DATABASE_ICON_DEFINITIONS: StandardsDatabaseIconDefinition[] = [
  {
    id: 'vcdb',
    label: 'VCdb',
    src: hoodVcdbIcon,
    matches: (name) => /^vcdb\b/i.test(name),
  },
  {
    id: 'pcdb',
    label: 'PCdb',
    src: hoodPcdbIcon,
    matches: (name) => /^pcdb\b/i.test(name),
  },
  {
    id: 'padb',
    label: 'PAdb',
    src: hoodPadbIcon,
    matches: (name) => /^padb\b/i.test(name),
  },
  {
    id: 'qdb',
    label: 'Qdb',
    src: hoodQdbIcon,
    matches: (name) => /^qdb\b/i.test(name),
  },
  {
    id: 'brand-table',
    label: 'Brand Table',
    src: hoodBrandTableIcon,
    matches: (name) => /brand table/i.test(name),
  },
  {
    id: 'digital-assets',
    label: 'Digital Assets',
    src: hoodDigitalAssetsIcon,
    matches: (name) => /digital assets/i.test(name),
  },
];

export function getStandardsDatabaseAccessIcons(
  subscribedProducts: string[] | undefined,
): StandardsDatabaseIcon[] {
  if (!subscribedProducts?.length) return [];

  const icons: StandardsDatabaseIcon[] = [];
  const seen = new Set<string>();

  for (const productName of subscribedProducts) {
    const trimmed = productName.trim();
    if (!trimmed) continue;

    const match = STANDARDS_DATABASE_ICON_DEFINITIONS.find(
      (definition) => definition.matches(trimmed) && !seen.has(definition.id),
    );
    if (!match) continue;

    seen.add(match.id);
    icons.push({ id: match.id, label: match.label, src: match.src });
  }

  return icons;
}
