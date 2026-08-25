export type AdminFieldType = 'string' | 'number' | 'boolean' | 'stringList';

export type AdminFieldDef = {
  path: string;
  label: string;
  type: AdminFieldType;
  readOnly?: boolean;
  section: string;
};

/** Flattened editable columns for the ADMIN company editor. */
export const ADMIN_REPORT_FIELDS: AdminFieldDef[] = [
  { section: 'Company', path: 'company.id', label: 'Company ID', type: 'string', readOnly: true },
  { section: 'Company', path: 'company.name', label: 'Company name', type: 'string' },
  { section: 'Company', path: 'company.recordNumber', label: 'Record number', type: 'number' },
  { section: 'Company', path: 'company.marketSegment', label: 'Market segment', type: 'string' },
  { section: 'Company', path: 'reportYear', label: 'Report year', type: 'number' },

  {
    section: 'Journey',
    path: 'journey.membershipSince',
    label: 'Membership since',
    type: 'string',
  },
  {
    section: 'Journey',
    path: 'journey.membershipTenureYears',
    label: 'Membership tenure (years)',
    type: 'number',
  },
  { section: 'Journey', path: 'journey.activeContacts', label: 'Active contacts', type: 'number' },
  {
    section: 'Journey',
    path: 'journey.communityMembers',
    label: 'Community members',
    type: 'number',
  },
  { section: 'Journey', path: 'journey.communities', label: 'Communities', type: 'stringList' },
  {
    section: 'Journey',
    path: 'journey.committeeMembers',
    label: 'Committee members',
    type: 'number',
  },

  {
    section: 'Events',
    path: 'events.inPersonAttended',
    label: 'In-person attended',
    type: 'number',
  },
  { section: 'Events', path: 'events.inPersonTotal', label: 'In-person total', type: 'number' },
  { section: 'Events', path: 'events.attendancePct', label: 'Attendance %', type: 'number' },
  { section: 'Events', path: 'events.webinarCount', label: 'Webinar count', type: 'number' },
  { section: 'Events', path: 'events.aapexAttended', label: 'AAPEX attended', type: 'boolean' },
  { section: 'Events', path: 'events.aapexExhibitor', label: 'AAPEX exhibitor', type: 'boolean' },

  {
    section: 'Products',
    path: 'products.trendLensUsers',
    label: 'TrendLens users',
    type: 'number',
  },
  {
    section: 'Products',
    path: 'products.trendLensContactPct',
    label: 'TrendLens contact %',
    type: 'number',
  },
  {
    section: 'Products',
    path: 'products.demandIndexGroups',
    label: 'Demand Index groups',
    type: 'number',
  },
  {
    section: 'Products',
    path: 'products.demandIndexGroupsTotal',
    label: 'Demand Index groups total',
    type: 'number',
  },
  { section: 'Products', path: 'products.academyUsers', label: 'Academy users', type: 'number' },
  {
    section: 'Products',
    path: 'products.academyCoursesCompleted',
    label: 'Academy courses completed',
    type: 'number',
  },

  { section: 'Factbook', path: 'factbook.users', label: 'Factbook users', type: 'number' },
  { section: 'Factbook', path: 'factbook.contactPct', label: 'Factbook contact %', type: 'number' },

  {
    section: 'Standards',
    path: 'standards.subscribedCount',
    label: 'Standards subscribed count',
    type: 'number',
  },
  {
    section: 'Standards',
    path: 'standards.subscribedProducts',
    label: 'Standards products',
    type: 'stringList',
  },
  {
    section: 'Standards',
    path: 'standards.subscribedPct',
    label: 'Standards subscribed %',
    type: 'number',
  },
];

export function getByPath(target: unknown, path: string): unknown {
  const parts = path.split('.').filter(Boolean);
  let current: unknown = target;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function formatAdminFieldValue(value: unknown, type: AdminFieldType): string {
  if (value == null) return '';
  if (type === 'stringList') {
    return Array.isArray(value) ? value.map(String).join(', ') : String(value);
  }
  if (type === 'boolean') {
    if (value === true) return 'true';
    if (value === false) return 'false';
    return '';
  }
  return String(value);
}

export function parseAdminFieldValue(raw: string, type: AdminFieldType): unknown {
  const trimmed = raw.trim();

  switch (type) {
    case 'number': {
      if (trimmed === '') return null;
      const num = Number(trimmed);
      if (!Number.isFinite(num)) throw new Error('Enter a valid number');
      return num;
    }
    case 'boolean': {
      if (trimmed === '') return undefined;
      const lower = trimmed.toLowerCase();
      if (lower === 'true' || lower === '1' || lower === 'yes') return true;
      if (lower === 'false' || lower === '0' || lower === 'no') return false;
      throw new Error('Enter true or false');
    }
    case 'stringList': {
      if (!trimmed) return [];
      return trimmed
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
    }
    case 'string':
    default:
      return trimmed === '' ? undefined : trimmed;
  }
}
