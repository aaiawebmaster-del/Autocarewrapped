/**
 * Auto Care Wrapped embed loader for the unified my.autocare.org/engagement page.
 *
 * On re:Members (AMA) the page uses a Query Content component that renders the
 * logged-in user's Organization ID via the {{RelatedOrganizationRecordNumber}}
 * shortcode. Place that shortcode inside an element and point the loader at it.
 *
 * Recommended usage on the /engagement page:
 *
 * <!-- Query Content component renders the logged-in user's org id here -->
 * <div id="autocare-record" style="display:none">{{RelatedOrganizationRecordNumber}}</div>
 *
 * <div id="autocare-wrapped"></div>
 * <script
 *   src="https://YOUR-SITE.netlify.app/embed.js"
 *   data-app-url="https://YOUR-SITE.netlify.app"
 *   data-target="autocare-wrapped"
 *   data-record-selector="#autocare-record"
 * ></script>
 *
 * Record number resolution order:
 *   1. data-record attribute on this script (admin override)
 *   2. ?record= / ?company= / ?companyId= query param (shared links)
 *   3. Text of the data-record-selector element (the rendered shortcode)
 *   4. /engagement/{recordNumber} path segment (legacy per-company pages)
 */
(function () {
  var script = document.currentScript;
  if (!script) return;

  var appUrl = (script.getAttribute('data-app-url') || '').replace(/\/$/, '');
  if (!appUrl) {
    console.error('[Auto Care Wrapped] Missing data-app-url on embed script.');
    return;
  }

  var targetId = script.getAttribute('data-target') || 'autocare-wrapped';
  var mount = document.getElementById(targetId);
  if (!mount) {
    console.error('[Auto Care Wrapped] Mount element #' + targetId + ' not found.');
    return;
  }

  var recordSelector = script.getAttribute('data-record-selector') || '#autocare-record';
  var iframeHeight = script.getAttribute('data-height') || '100dvh';

  // Pull the first 5-9 digit run out of a value. Returns null for empty values or
  // an unresolved shortcode (e.g. the literal "{{RelatedOrganizationRecordNumber}}"
  // before re:Members substitutes it).
  function extractRecord(value) {
    if (value == null) return null;
    value = String(value);
    if (value.indexOf('{{') !== -1 || value.indexOf('}}') !== -1) return null;
    var match = value.match(/\d{5,9}/);
    return match ? match[0] : null;
  }

  function fromScriptAttr() {
    return extractRecord(script.getAttribute('data-record'));
  }

  function fromQuery() {
    try {
      var params = new URLSearchParams(window.location.search);
      return extractRecord(
        params.get('record') || params.get('company') || params.get('companyId'),
      );
    } catch (err) {
      return null;
    }
  }

  function fromElement() {
    if (!recordSelector) return null;
    try {
      var el = document.querySelector(recordSelector);
      if (!el) return null;
      var raw =
        el.textContent ||
        el.getAttribute('value') ||
        el.getAttribute('content') ||
        el.getAttribute('data-record');
      return extractRecord(raw);
    } catch (err) {
      return null;
    }
  }

  function fromPath() {
    var match = window.location.pathname.match(/\/engagement\/(\d+)\/?$/i);
    return match ? match[1] : null;
  }

  function resolveRecord() {
    return fromScriptAttr() || fromQuery() || fromElement() || fromPath();
  }

  function renderIframe(recordNumber) {
    var iframe = document.createElement('iframe');
    iframe.src = appUrl + '/?record=' + encodeURIComponent(recordNumber) + '&embed=1';
    iframe.title = 'Your Year In Review';
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('allow', 'fullscreen');
    iframe.style.border = '0';
    iframe.style.width = '100%';
    iframe.style.maxWidth = '100%';
    iframe.style.display = 'block';
    iframe.style.minHeight = iframeHeight;
    iframe.style.height = iframeHeight;

    mount.innerHTML = '';
    mount.appendChild(iframe);
  }

  function showMessage(text) {
    mount.innerHTML =
      '<p style="font-family:Segoe UI,sans-serif;color:#4a5568;padding:1rem;">' +
      text +
      '</p>';
  }

  var record = resolveRecord();
  if (record) {
    renderIframe(record);
    return;
  }

  // The Query Content shortcode may be injected after this script runs. Watch the
  // DOM and poll briefly until the org id appears, then mount.
  var settled = false;
  var observer = null;
  var timer = null;

  function finish(recordNumber) {
    if (settled) return;
    settled = true;
    if (timer) clearInterval(timer);
    if (observer) observer.disconnect();
    renderIframe(recordNumber);
  }

  function tryResolve() {
    var found = resolveRecord();
    if (found) finish(found);
    return Boolean(found);
  }

  if (window.MutationObserver) {
    observer = new MutationObserver(tryResolve);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  var attempts = 0;
  var maxAttempts = 40; // ~10s at 250ms
  timer = setInterval(function () {
    attempts += 1;
    if (tryResolve()) return;
    if (attempts >= maxAttempts) {
      if (settled) return;
      settled = true;
      clearInterval(timer);
      if (observer) observer.disconnect();
      showMessage(
        'Your Year In Review: we couldn\u2019t find your organization ID. Please make sure you\u2019re signed in and try again.',
      );
    }
  }, 250);
})();
