/**
 * Auto Care Wrapped embed loader for the unified my.autocare.org engagement page.
 *
 * The page uses a re:Members (AMA) Query Content component that renders the logged-in
 * user's related Organization ID(s). That component may output more than one record
 * (e.g. a <ul class="list-results"> with several <li> items), and only some
 * organizations have a Wrapped report. The loader therefore collects ALL candidate
 * record numbers and hands them to the app, which loads the first one that has a report.
 *
 * Recommended usage:
 *
 * <div id="autocare-wrapped"></div>
 * <script
 *   src="https://YOUR-SITE.netlify.app/embed.js"
 *   data-app-url="https://YOUR-SITE.netlify.app"
 *   data-target="autocare-wrapped"
 *   data-record-selector=".list-results .list-result"
 * ></script>
 *
 * Candidate record numbers are gathered (in order) from:
 *   1. data-record attribute on this script (admin override)
 *   2. ?record= / ?company= / ?companyId= query param (shared links)
 *   3. Every element matching data-record-selector (the rendered shortcode list)
 *   4. /engagement/{recordNumber} path segment (legacy per-company pages)
 *
 * When re:Members admin impersonation is active (#main_lnkEndImpersonate /
 * .impersonate-header-inner), the iframe is loaded with &impersonating=1 so the
 * app skips usage analytics for that session.
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

  function elementValue(el) {
    return (
      el.textContent ||
      el.getAttribute('value') ||
      el.getAttribute('content') ||
      el.getAttribute('data-record')
    );
  }

  // Collect every candidate record number, in priority order, de-duplicated.
  function collectRecords() {
    var records = [];
    function add(value) {
      var record = extractRecord(value);
      if (record && records.indexOf(record) === -1) records.push(record);
    }

    add(script.getAttribute('data-record'));

    try {
      var params = new URLSearchParams(window.location.search);
      add(params.get('record'));
      add(params.get('company'));
      add(params.get('companyId'));
    } catch (err) {
      /* no-op */
    }

    if (recordSelector) {
      try {
        var els = document.querySelectorAll(recordSelector);
        for (var i = 0; i < els.length; i += 1) {
          add(elementValue(els[i]));
        }
      } catch (err) {
        /* invalid selector — ignore */
      }
    }

    var pathMatch = window.location.pathname.match(/\/engagement\/(\d+)\/?$/i);
    if (pathMatch) add(pathMatch[1]);

    return records;
  }

  // re:Members admin impersonation shows a blue bar with #main_lnkEndImpersonate /
  // .impersonate-header-inner. Those sessions must not count toward usage reporting.
  function isImpersonating() {
    try {
      if (document.getElementById('main_lnkEndImpersonate')) return true;
      if (document.querySelector('.impersonate-header-inner')) return true;
      if (document.querySelector('.impersonate-header-text')) return true;
    } catch (err) {
      /* no-op */
    }
    return false;
  }

  function renderIframe(records) {
    var iframe = document.createElement('iframe');
    var src =
      appUrl +
      '/?records=' +
      encodeURIComponent(records.join(',')) +
      '&record=' +
      encodeURIComponent(records[0]) +
      '&embed=1';
    if (isImpersonating()) {
      src += '&impersonating=1';
    }
    iframe.src = src;
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

  var records = collectRecords();
  if (records.length > 0) {
    renderIframe(records);
    return;
  }

  // The Query Content shortcode may be injected after this script runs. Watch the
  // DOM and poll until an org id appears. Once the page has finished loading we only
  // wait a short grace period before concluding the user has no organization, so the
  // fallback message appears quickly instead of after a long fixed timeout.
  var settled = false;
  var observer = null;
  var timer = null;
  var startedAt = Date.now();
  var loadedAt = document.readyState === 'complete' ? startedAt : null;

  if (loadedAt === null) {
    window.addEventListener('load', function () {
      if (loadedAt === null) loadedAt = Date.now();
    });
  }

  function cleanup() {
    if (timer) clearInterval(timer);
    if (observer) observer.disconnect();
  }

  function mountIfFound() {
    if (settled) return true;
    var found = collectRecords();
    if (found.length > 0) {
      settled = true;
      cleanup();
      renderIframe(found);
      return true;
    }
    return false;
  }

  if (window.MutationObserver) {
    observer = new MutationObserver(mountIfFound);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  var GRACE_AFTER_LOAD_MS = 1500; // wait a bit past full load for async component render
  var HARD_TIMEOUT_MS = 8000; // absolute cap in case the load event never fires

  timer = setInterval(function () {
    if (mountIfFound()) return;
    var now = Date.now();
    var pastGrace = loadedAt !== null && now - loadedAt >= GRACE_AFTER_LOAD_MS;
    var pastHardCap = now - startedAt >= HARD_TIMEOUT_MS;
    if (pastGrace || pastHardCap) {
      settled = true;
      cleanup();
      showMessage(
        'Your Year In Review: we couldn\u2019t find your organization ID. Please make sure you\u2019re signed in and try again.',
      );
    }
  }, 200);
})();
