export function getReportingPassword() {
  return process.env.FEEDBACK_REPORT_PASSWORD ?? 'flight-dash-carp';
}

/**
 * @param {Request | import('node:http').IncomingMessage} request
 */
export function isReportingPasswordValid(request) {
  const expected = getReportingPassword();
  const provided =
    'headers' in request && typeof request.headers.get === 'function'
      ? request.headers.get('x-reporting-password') ?? ''
      : String(request.headers['x-reporting-password'] ?? '');
  return provided.length > 0 && provided === expected;
}
