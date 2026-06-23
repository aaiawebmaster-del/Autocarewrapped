/**
 * Auto Care Wrapped embed loader for my.autocare.org/engagement/{recordNumber}
 *
 * Usage on Impexium page:
 * <div id="autocare-wrapped"></div>
 * <script
 *   src="https://YOUR-SITE.netlify.app/embed.js"
 *   data-app-url="https://YOUR-SITE.netlify.app"
 *   data-target="autocare-wrapped"
 * ></script>
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

  var recordNumber =
    script.getAttribute('data-record') ||
    (function () {
      var match = window.location.pathname.match(/\/engagement\/(\d+)\/?$/i);
      return match ? match[1] : null;
    })();

  if (!recordNumber) {
    mount.innerHTML =
      '<p style="font-family:Segoe UI,sans-serif;color:#4a5568;padding:1rem;">Your Year In Review: no record number found in URL.</p>';
    return;
  }

  var iframe = document.createElement('iframe');
  iframe.src = appUrl + '/?record=' + encodeURIComponent(recordNumber) + '&embed=1';
  iframe.title = 'Your Year In Review';
  iframe.setAttribute('loading', 'lazy');
  iframe.setAttribute('allow', 'fullscreen');
  iframe.style.border = '0';
  iframe.style.width = '100%';
  iframe.style.maxWidth = '100%';
  iframe.style.display = 'block';
  iframe.style.minHeight = '100dvh';
  iframe.style.height = script.getAttribute('data-height') || '100dvh';

  mount.innerHTML = '';
  mount.appendChild(iframe);
})();
