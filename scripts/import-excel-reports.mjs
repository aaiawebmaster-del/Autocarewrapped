/**
 * Builds WrappedReport JSON files from the October Renewal Companies workbook.
 * Output: public/data/reports/{recordNumber}.json
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DEFAULT_XLSX = join(ROOT, 'data/source/Wrapped - October Renewal Companies.xlsx');
const OUT_DIR = join(ROOT, 'public/data/reports');
const REPORT_YEAR = 2026;
const IN_PERSON_EVENTS_TOTAL = 8;
const IN_PERSON_CATEGORIES = new Set(['CONF', 'Networking']);
const DEMAND_INDEX_EXCLUDED = new Set([
  'Annual Unit Volumes',
  'Product Plus (includes 4 products)',
]);

/** Retailers skip DemandIndex in Kick the Tires and Full Diagnostics. */
const RETAILER_RECORD_NUMBERS = new Set([1386304]);

/** Manual community lists per Impexium record until CRM export is authoritative. */
const COMMUNITY_LIST_OVERRIDES = {
  '1100433': ['AWDA Community'],
  '1101050': [
    'Automotive Communications Council',
    'AWDA Community',
    'Women in Auto Care',
    'YANG Membership',
  ],
  '1101623': ['AWDA Community'],
  '1252425': ['AWDA Community'],
  '1252576': ['AWDA Community'],
  '1376049': [
    'Automotive Content Professionals Network',
    'AWDA Community',
    'Import Vehicle Community',
  ],
  '1351167': ['AWDA Community'],
  '1257307': ['AWDA Community', 'Women in Auto Care', 'YANG Membership'],
  '1255413': ['AWDA Community'],
};

/** Manual Kick the Tires / Factbook values until TrendLens & Factbook APIs are wired. */
const REPORT_PRODUCT_OVERRIDES = {
  '1100433': {
    journey: {
      membershipTenureYears: 49,
      activeContacts: 57,
      communityMembers: 1,
      committeeMembers: 2,
    },
    events: {
      inPersonAttended: 4,
      attendancePct: 50,
      webinarCount: 6,
      aapexAttended: false,
    },
    products: {
      trendLensUsers: 0,
      demandIndexGroups: 6,
      demandIndexGroupsTotal: 200,
      academyUsers: 1,
      academyCoursesCompleted: 1,
    },
    factbook: {
      users: 0,
    },
  },
  '1101623': {
    journey: {
      membershipTenureYears: 43,
      activeContacts: 31,
      communityMembers: 30,
      committeeMembers: 0,
    },
    events: {
      inPersonAttended: 3,
      attendancePct: 38,
      webinarCount: 5,
    },
    products: {
      academyUsers: 1,
      academyCoursesCompleted: 1,
    },
  },
  '1252425': {
    journey: {
      membershipTenureYears: 23,
      activeContacts: 40,
      communityMembers: 40,
      committeeMembers: 0,
    },
    events: {
      inPersonAttended: 4,
      attendancePct: 50,
      webinarCount: 5,
      aapexAttended: false,
    },
  },
  '1252576': {
    journey: {
      membershipTenureYears: 25,
      activeContacts: 78,
      communityMembers: 78,
      committeeMembers: 0,
    },
    events: {
      inPersonAttended: 3,
      attendancePct: 38,
      webinarCount: 2,
    },
  },
  '1361271': {
    journey: {
      membershipTenureYears: 12,
      activeContacts: 66,
      communityMembers: 0,
      committeeMembers: 0,
    },
    events: {
      inPersonAttended: 3,
      attendancePct: 38,
      webinarCount: 5,
    },
    products: {
      academyUsers: 3,
      academyCoursesCompleted: 3,
    },
  },
  '1381305': {
    journey: {
      membershipTenureYears: 4,
      activeContacts: 12,
      communityMembers: 0,
      committeeMembers: 0,
    },
    events: {
      inPersonAttended: 0,
      attendancePct: 0,
      webinarCount: 0,
    },
  },
  '1101050': {
    journey: {
      activeContacts: 88,
    },
    events: {
      webinarCount: 22,
    },
    products: {
      trendLensUsers: 4,
      demandIndexGroups: 6,
      demandIndexGroupsTotal: 200,
      academyCoursesCompleted: 2,
    },
    factbook: {
      users: 3,
    },
  },
  '1376049': {
    journey: {
      activeContacts: 15,
    },
    events: {
      webinarCount: 2,
    },
    products: {
      academyCoursesCompleted: 3,
    },
  },
  '1351167': {
    journey: {
      activeContacts: 15,
      committeeMembers: 1,
    },
    events: {
      inPersonAttended: 1,
      attendancePct: 13,
    },
  },
  '1257307': {
    products: {
      trendLensUsers: 1,
    },
  },
  '1255413': {
    journey: {
      membershipTenureYears: 18,
      communityMembers: 13,
    },
    events: {
      inPersonAttended: 0,
      inPersonTotal: 8,
      attendancePct: 0,
      aapexAttended: false,
    },
    products: {
      demandIndexGroups: 0,
    },
  },
};

const xlsxPath = process.env.WRAPPED_XLSX ?? DEFAULT_XLSX;

function sheetRows(workbook, name) {
  return XLSX.utils.sheet_to_json(workbook.Sheets[name], { defval: '' });
}

function isNumericRecord(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function pct(attended, total) {
  if (total <= 0) return 0;
  return Math.round((attended / total) * 100);
}

function contactPct(users, contacts) {
  if (contacts <= 0) return 0;
  return Math.round((users / contacts) * 100);
}

function loadWorkbook() {
  return XLSX.readFile(xlsxPath);
}

function buildReports(workbook) {
  const organizations = sheetRows(workbook, 'Organization').filter((row) =>
    isNumericRecord(row.RECORDNUMBER),
  );
  const tenureByRecord = indexBy(sheetRows(workbook, 'Membership tenure'), 'RECORDNUMBER');
  const contactsByRecord = indexBy(sheetRows(workbook, 'Number of contacts'), 'RecordNumber');
  const standardsRows = sheetRows(workbook, 'Standards subscriber').filter((row) =>
    isNumericRecord(row.RecordNumber),
  );
  const demandRows = sheetRows(workbook, 'Demand Index subscriber').filter(
    (row) =>
      isNumericRecord(row.RecordNumber) &&
      !String(row.__EMPTY ?? '').includes('never') &&
      !DEMAND_INDEX_EXCLUDED.has(String(row.SubscriptionProductName ?? '').trim()),
  );
  const eventRows = sheetRows(workbook, 'Attended an Auto Care event').filter((row) =>
    isNumericRecord(row.RecordNumber),
  );
  const webinarRows = sheetRows(workbook, 'Attended a webinar').filter((row) =>
    isNumericRecord(row.RecordNumber),
  );
  const academyRows = sheetRows(workbook, 'Completed an Academy course').filter((row) =>
    isNumericRecord(row.CompanyRecordNumber),
  );
  const committeeRows = sheetRows(workbook, 'Committee Participation').filter((row) =>
    isNumericRecord(row.RecordNumber),
  );
  const communityRows = sheetRows(workbook, 'Community Participation').filter((row) =>
    isNumericRecord(row.RecordNumber),
  );

  const allStandardsProducts = unique(
    standardsRows.map((row) => String(row.SubscriptionProductName ?? '').trim()),
  );
  const allDemandProducts = unique(
    demandRows.map((row) => String(row.SubscriptionProductName ?? '').trim()),
  );

  return organizations.map((org) => {
    const recordNumber = String(org.RECORDNUMBER);
    const name = String(org.NAME ?? '').trim();
    const tenure = tenureByRecord.get(org.RECORDNUMBER) ?? {};
    const contactsRow = contactsByRecord.get(org.RECORDNUMBER) ?? {};
    const activeContacts = Number(contactsRow['Contact Count'] ?? 0);

    const orgStandards = standardsRows.filter((row) => row.RecordNumber === org.RECORDNUMBER);
    const subscribedProducts = unique(
      orgStandards.map((row) => String(row.SubscriptionProductName ?? '').trim()),
    );

    const orgDemand = demandRows.filter((row) => row.RecordNumber === org.RECORDNUMBER);
    const demandProducts = unique(
      orgDemand
        .map((row) => String(row.SubscriptionProductName ?? '').trim())
        .filter((name) => !DEMAND_INDEX_EXCLUDED.has(name)),
    );

    const orgInPerson = eventRows.filter(
      (row) =>
        row.RecordNumber === org.RECORDNUMBER &&
        IN_PERSON_CATEGORIES.has(String(row.CategoryCode ?? '').trim()),
    );
    const inPersonAttended = unique(orgInPerson.map((row) => String(row.ProductName ?? '').trim()))
      .length;

    const orgWebinars = webinarRows.filter((row) => row.RecordNumber === org.RECORDNUMBER);
    const webinarCount = unique(orgWebinars.map((row) => String(row.ProductName ?? '').trim()))
      .length;

    const orgAcademy = academyRows.filter((row) => row.CompanyRecordNumber === org.RECORDNUMBER);
    const academyUsers = unique(orgAcademy.map((row) => row.CustomerRecordNumber)).length;
    const academyCoursesCompleted = orgAcademy.length;

    const orgCommittees = committeeRows.filter((row) => row.RecordNumber === org.RECORDNUMBER);
    const committeeMembers = orgCommittees.length;

    const orgCommunities = communityRows.filter((row) => row.RecordNumber === org.RECORDNUMBER);
    const communities = unique(
      orgCommunities
        .map((row) => String(row.MembershipName ?? '').trim())
        .filter((value) => value && value !== 'MembershipName'),
    );
    const communityMembers = orgCommunities.length;

    const trendLensUsers = 0;
    const factbookUsers = 0;

    const report = {
      reportYear: REPORT_YEAR,
      company: {
        id: recordNumber,
        name,
        recordNumber: org.RECORDNUMBER,
        ...(RETAILER_RECORD_NUMBERS.has(org.RECORDNUMBER)
          ? { marketSegment: 'retailer' }
          : {}),
      },
      journey: {
        membershipTenureYears: Number(tenure.YearsActive ?? 0),
        activeContacts,
        communityMembers,
        communities,
        committeeMembers,
      },
      events: {
        inPersonAttended,
        inPersonTotal: IN_PERSON_EVENTS_TOTAL,
        attendancePct: pct(inPersonAttended, IN_PERSON_EVENTS_TOTAL),
        webinarCount,
      },
      products: {
        trendLensUsers,
        trendLensContactPct: contactPct(trendLensUsers, activeContacts),
        demandIndexGroups: demandProducts.length,
        demandIndexGroupsTotal: 200,
        academyUsers,
        academyCoursesCompleted,
      },
      factbook: {
        users: factbookUsers,
        contactPct: contactPct(factbookUsers, activeContacts),
      },
      standards: {
        subscribedCount: subscribedProducts.length,
        subscribedProducts,
        subscribedPct:
          allStandardsProducts.length > 0
            ? pct(subscribedProducts.length, allStandardsProducts.length)
            : 0,
      },
    };

    const override = REPORT_PRODUCT_OVERRIDES[recordNumber];
    if (override?.products) {
      Object.assign(report.products, override.products);
    }
    if (override?.factbook) {
      Object.assign(report.factbook, override.factbook);
    }
    if (override?.journey) {
      Object.assign(report.journey, override.journey);
    }
    if (override?.events) {
      Object.assign(report.events, override.events);
    }

    const communityOverride = COMMUNITY_LIST_OVERRIDES[recordNumber];
    if (communityOverride) {
      report.journey.communities = communityOverride;
    }

    report.products.trendLensContactPct = contactPct(
      report.products.trendLensUsers,
      report.journey.activeContacts,
    );
    report.factbook.contactPct = contactPct(
      report.factbook.users,
      report.journey.activeContacts,
    );

    return report;
  });
}

function indexBy(rows, key) {
  const map = new Map();
  for (const row of rows) {
    const value = row[key];
    if (isNumericRecord(value)) map.set(value, row);
  }
  return map;
}

function main() {
  const workbook = loadWorkbook();
  const reports = buildReports(workbook);

  mkdirSync(OUT_DIR, { recursive: true });

  for (const report of reports) {
    const filePath = join(OUT_DIR, `${report.company.id}.json`);
    writeFileSync(filePath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    console.log(`Wrote ${filePath} (${report.company.name})`);
  }

  writeFileSync(
    join(OUT_DIR, 'index.json'),
    `${JSON.stringify(
      reports.map((report) => ({
        recordNumber: report.company.recordNumber,
        id: report.company.id,
        name: report.company.name,
        pagePath: `/engagement?record=${report.company.id}`,
      })),
      null,
      2,
    )}\n`,
    'utf8',
  );

  console.log(`Generated ${reports.length} reports from ${xlsxPath}`);
}

main();
