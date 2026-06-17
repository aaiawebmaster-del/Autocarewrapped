import hoodBrandTableIcon from '@/assets/hood-brand-table-icon.png';
import hoodDigitalAssetsIcon from '@/assets/hood-digital-assets-icon.png';
import hoodPadbIcon from '@/assets/hood-padb-icon.png';
import hoodPcdbIcon from '@/assets/hood-pcdb-icon.png';
import hoodQdbIcon from '@/assets/hood-qdb-icon.png';
import hoodVcdbIcon from '@/assets/hood-vcdb-icon.png';
import acesLogo from '@/assets/auto-care-aces-logo.png';
import piesLogo from '@/assets/auto-care-pies-logo.png';

export type StandardsDatabaseIcon = {
  id: string;
  label: string;
  src: string;
};

export type StandardsProtocolAccess = {
  aces: boolean;
  pies: boolean;
};

export type StandardsProtocolLogo = {
  id: 'aces' | 'pies';
  label: string;
  src: string;
  active: boolean;
};

type StandardsDatabaseIconDefinition = StandardsDatabaseIcon & {
  matches: (subscriptionProductName: string) => boolean;
};

const STANDARDS_COVERAGE_DATABASES = [
  'vcdb',
  'qdb',
  'padb',
  'brand-table',
  'pcdb',
  'best-practices',
] as const;

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

function normalizeSubscribedProducts(
  subscribedProducts: string[] | undefined,
): string[] {
  return (subscribedProducts ?? [])
    .map((name) => name.trim())
    .filter(Boolean);
}

function hasVcdbSubscription(subscribedProducts: string[]): boolean {
  return subscribedProducts.some((name) => /^vcdb\b/i.test(name));
}

function hasPadbSubscription(subscribedProducts: string[]): boolean {
  return subscribedProducts.some((name) => /^padb\b/i.test(name));
}

function hasBrandTableSubscription(subscribedProducts: string[]): boolean {
  return subscribedProducts.some((name) => /brand table/i.test(name));
}

function hasBestPracticesSubscription(subscribedProducts: string[]): boolean {
  return subscribedProducts.some((name) => /best practice/i.test(name));
}

/** VCdb unlocks ACES (VCdb + PCdb + Qdb). PAdb unlocks PIES (PAdb + PCdb). */
export function getStandardsProtocolAccess(
  subscribedProducts: string[] | undefined,
): StandardsProtocolAccess {
  const products = normalizeSubscribedProducts(subscribedProducts);
  return {
    aces: hasVcdbSubscription(products),
    pies: hasPadbSubscription(products),
  };
}

export function getStandardsProtocolLogos(
  subscribedProducts: string[] | undefined,
): StandardsProtocolLogo[] {
  const access = getStandardsProtocolAccess(subscribedProducts);
  return [
    {
      id: 'aces',
      label: 'ACES',
      src: acesLogo,
      active: access.aces,
    },
    {
      id: 'pies',
      label: 'PIES',
      src: piesLogo,
      active: access.pies,
    },
  ];
}

function getDerivedDatabaseAccessIds(
  subscribedProducts: string[] | undefined,
): Set<string> {
  const products = normalizeSubscribedProducts(subscribedProducts);
  const access = new Set<string>();

  if (hasVcdbSubscription(products)) {
    access.add('vcdb');
    access.add('pcdb');
    access.add('qdb');
  }

  if (hasPadbSubscription(products)) {
    access.add('padb');
    access.add('pcdb');
  }

  for (const productName of products) {
    for (const definition of STANDARDS_DATABASE_ICON_DEFINITIONS) {
      if (definition.matches(productName)) {
        access.add(definition.id);
      }
    }
  }

  return access;
}

/** 100% = VCdb, Qdb, PAdb, Brand Table, PCdb, and Best Practices available. */
export function getStandardsSubscribedPct(
  subscribedProducts: string[] | undefined,
): number {
  const products = normalizeSubscribedProducts(subscribedProducts);
  const available = new Set<string>();

  if (hasVcdbSubscription(products)) {
    available.add('vcdb');
    available.add('qdb');
    available.add('pcdb');
  }

  if (hasPadbSubscription(products)) {
    available.add('padb');
    available.add('pcdb');
  }

  if (hasBrandTableSubscription(products)) {
    available.add('brand-table');
  }

  if (hasBestPracticesSubscription(products)) {
    available.add('best-practices');
  }

  const covered = STANDARDS_COVERAGE_DATABASES.filter((id) => available.has(id)).length;
  return Math.round((covered / STANDARDS_COVERAGE_DATABASES.length) * 100);
}

export function getStandardsDatabaseAccessIcons(
  subscribedProducts: string[] | undefined,
): StandardsDatabaseIcon[] {
  const accessIds = getDerivedDatabaseAccessIds(subscribedProducts);
  if (!accessIds.size) return [];

  const icons: StandardsDatabaseIcon[] = [];
  for (const definition of STANDARDS_DATABASE_ICON_DEFINITIONS) {
    if (!accessIds.has(definition.id)) continue;
    icons.push({
      id: definition.id,
      label: definition.label,
      src: definition.src,
    });
  }

  return icons;
}
