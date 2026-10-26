/* Private GA4 reports. Set measurementId to the website owner's web stream ID. */
(() => {
  'use strict';
  const measurementId = 'G-Z6BLXSVBLN';
  if (!/^G-[A-Z0-9]+$/.test(measurementId)) return;
  if (location.protocol !== 'https:' || location.hostname !== 'ariakawa.github.io') return;
  if (window.__peanutTrafficStarted) return;
  window.__peanutTrafficStarted = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    page_location: location.origin + location.pathname,
    page_referrer: document.referrer ? new URL(document.referrer).origin : '',
  });
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
  document.head.appendChild(script);
})();