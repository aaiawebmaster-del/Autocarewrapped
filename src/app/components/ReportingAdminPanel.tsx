import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ADMIN_REPORT_FIELDS,
  formatAdminFieldValue,
  getByPath,
  parseAdminFieldValue,
  type AdminFieldDef,
} from '@/lib/adminReportFields';
import {
  fetchAdminReports,
  patchAdminReportField,
  publishAdminReport,
  ReportAdminError,
} from '@/lib/api/reportAdmin';
import type { WrappedReport } from '@/types/wrappedReport';

type ReportingAdminPanelProps = {
  password: string;
  onAuthError: () => void;
};

type EditState = {
  companyId: string;
  path: string;
  draft: string;
};

function groupFieldsBySection(fields: AdminFieldDef[]) {
  const sections: { name: string; fields: AdminFieldDef[] }[] = [];
  for (const field of fields) {
    const existing = sections.find((section) => section.name === field.section);
    if (existing) existing.fields.push(field);
    else sections.push({ name: field.section, fields: [field] });
  }
  return sections;
}

function CompanyAdminRow({
  report,
  editState,
  busyPath,
  onStartEdit,
  onCancelEdit,
  onDraftChange,
  onPublishField,
}: {
  report: WrappedReport;
  editState: EditState | null;
  busyPath: string | null;
  onStartEdit: (companyId: string, field: AdminFieldDef, currentDisplay: string) => void;
  onCancelEdit: () => void;
  onDraftChange: (value: string) => void;
  onPublishField: (companyId: string, field: AdminFieldDef, draft: string) => void;
}) {
  const companyId = report.company.id;
  const sections = useMemo(() => groupFieldsBySection(ADMIN_REPORT_FIELDS), []);

  return (
    <details className="reporting-page__admin-company">
      <summary className="reporting-page__admin-company-summary">
        <span className="reporting-page__admin-company-name">{report.company.name}</span>
        <span className="reporting-page__admin-company-meta">
          <span>ID {report.company.id}</span>
          <span>{report.journey.membershipTenureYears} yrs</span>
          <span>{report.journey.communities.length} communities</span>
        </span>
      </summary>

      <div className="reporting-page__admin-company-body">
        {sections.map((section) => (
          <div key={section.name} className="reporting-page__admin-section">
            <h3 className="reporting-page__admin-section-title">{section.name}</h3>
            <div className="reporting-page__table-wrap">
              <table className="reporting-page__table reporting-page__table--admin">
                <thead>
                  <tr>
                    <th scope="col">Field</th>
                    <th scope="col">Value</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {section.fields.map((field) => {
                    const rawValue = getByPath(report, field.path);
                    const display = formatAdminFieldValue(rawValue, field.type);
                    const isEditing =
                      editState?.companyId === companyId && editState.path === field.path;
                    const isBusy = busyPath === `${companyId}:${field.path}`;

                    return (
                      <tr key={field.path}>
                        <td>
                          <div className="reporting-page__admin-field-label">{field.label}</div>
                          <div className="reporting-page__admin-field-path">{field.path}</div>
                        </td>
                        <td className="reporting-page__admin-value-cell">
                          {isEditing ? (
                            field.type === 'stringList' ? (
                              <textarea
                                className="reporting-page__admin-input reporting-page__admin-input--area"
                                value={editState.draft}
                                onChange={(event) => onDraftChange(event.target.value)}
                                rows={3}
                                disabled={isBusy}
                                aria-label={`Edit ${field.label}`}
                              />
                            ) : (
                              <input
                                className="reporting-page__admin-input"
                                value={editState.draft}
                                onChange={(event) => onDraftChange(event.target.value)}
                                disabled={isBusy}
                                aria-label={`Edit ${field.label}`}
                              />
                            )
                          ) : (
                            <span className="reporting-page__admin-value">
                              {display === '' ? '—' : display}
                            </span>
                          )}
                        </td>
                        <td>
                          {field.readOnly ? (
                            <span className="reporting-page__admin-readonly">Read-only</span>
                          ) : isEditing ? (
                            <div className="reporting-page__admin-row-actions">
                              <button
                                type="button"
                                className="reporting-page__button"
                                disabled={isBusy}
                                onClick={() => onPublishField(companyId, field, editState.draft)}
                              >
                                {isBusy ? 'Publishing…' : 'Publish update'}
                              </button>
                              <button
                                type="button"
                                className="reporting-page__button reporting-page__button--ghost"
                                disabled={isBusy}
                                onClick={onCancelEdit}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="reporting-page__button reporting-page__button--ghost"
                              onClick={() => onStartEdit(companyId, field, display)}
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

export default function ReportingAdminPanel({ password, onAuthError }: ReportingAdminPanelProps) {
  const [reports, setReports] = useState<WrappedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [editState, setEditState] = useState<EditState | null>(null);
  const [busyPath, setBusyPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchAdminReports(password);
      setReports(next);
    } catch (err) {
      const message =
        err instanceof ReportAdminError
          ? err.status === 401
            ? 'Incorrect password.'
            : err.message
          : 'Unable to load company reports.';
      setError(message);
      setReports([]);
      if (err instanceof ReportAdminError && err.status === 401) onAuthError();
    } finally {
      setLoading(false);
    }
  }, [password, onAuthError]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const filteredReports = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return reports;
    return reports.filter((report) => {
      const haystack = `${report.company.name} ${report.company.id} ${report.company.recordNumber ?? ''}`;
      return haystack.toLowerCase().includes(needle);
    });
  }, [reports, query]);

  const replaceReport = (nextReport: WrappedReport) => {
    setReports((current) => {
      const index = current.findIndex((report) => report.company.id === nextReport.company.id);
      if (index === -1) {
        return [...current, nextReport].sort((a, b) =>
          a.company.name.localeCompare(b.company.name),
        );
      }
      const copy = [...current];
      copy[index] = nextReport;
      return copy;
    });
  };

  const handlePublishField = async (companyId: string, field: AdminFieldDef, draft: string) => {
    setBusyPath(`${companyId}:${field.path}`);
    setError(null);
    setStatus(null);
    try {
      const value = parseAdminFieldValue(draft, field.type);
      const nextReport = await patchAdminReportField(password, companyId, field.path, value);
      replaceReport(nextReport);
      setEditState(null);
      setStatus(`Published ${field.label} for ${nextReport.company.name}.`);
    } catch (err) {
      const message =
        err instanceof ReportAdminError
          ? err.status === 401
            ? 'Incorrect password.'
            : err.message
          : err instanceof Error
            ? err.message
            : 'Unable to publish field update.';
      setError(message);
      if (err instanceof ReportAdminError && err.status === 401) onAuthError();
    } finally {
      setBusyPath(null);
    }
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploading(true);
    setError(null);
    setStatus(null);

    try {
      const raw = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new Error('File is not valid JSON.');
      }

      const report = await publishAdminReport(password, parsed as WrappedReport);
      replaceReport(report);
      setStatus(
        `Uploaded and published ${report.company.name} (${report.company.id}). Live experience will use this data.`,
      );
    } catch (err) {
      const message =
        err instanceof ReportAdminError
          ? err.status === 401
            ? 'Incorrect password.'
            : err.message
          : err instanceof Error
            ? err.message
            : 'Unable to upload report JSON.';
      setError(message);
      if (err instanceof ReportAdminError && err.status === 401) onAuthError();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="reporting-page__admin">
      <section className="reporting-page__section" aria-label="Upload company report JSON">
        <h2 className="reporting-page__section-title">Upload JSON</h2>
        <p className="reporting-page__admin-copy">
          Upload a full company report JSON file. Matching <code>company.id</code> values update the
          live report; new IDs create a report immediately.
        </p>
        <label className="reporting-page__admin-upload">
          <span className="reporting-page__button">
            {uploading ? 'Uploading…' : 'Choose JSON file'}
          </span>
          <input
            type="file"
            accept="application/json,.json"
            disabled={uploading || loading}
            onChange={(event) => void handleUpload(event)}
          />
        </label>
      </section>

      <section className="reporting-page__section" aria-label="Company report data">
        <div className="reporting-page__admin-toolbar">
          <h2 className="reporting-page__section-title">Company data</h2>
          <div className="reporting-page__admin-toolbar-actions">
            <input
              className="reporting-page__input reporting-page__admin-search"
              type="search"
              placeholder="Search companies"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search companies"
            />
            <button
              type="button"
              className="reporting-page__button"
              disabled={loading || uploading}
              onClick={() => void loadReports()}
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? <p className="reporting-page__status">Loading company reports…</p> : null}
        {error ? <p className="reporting-page__error">{error}</p> : null}
        {status ? <p className="reporting-page__status reporting-page__status--ok">{status}</p> : null}

        {!loading && filteredReports.length === 0 ? (
          <p className="reporting-page__empty">No company reports found.</p>
        ) : null}

        <div className="reporting-page__admin-list">
          {filteredReports.map((report) => (
            <CompanyAdminRow
              key={report.company.id}
              report={report}
              editState={editState}
              busyPath={busyPath}
              onStartEdit={(companyId, field, currentDisplay) =>
                setEditState({ companyId, path: field.path, draft: currentDisplay })
              }
              onCancelEdit={() => setEditState(null)}
              onDraftChange={(value) =>
                setEditState((current) => (current ? { ...current, draft: value } : current))
              }
              onPublishField={(companyId, field, draft) => {
                void handlePublishField(companyId, field, draft);
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
