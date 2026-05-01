import { initLangMenu } from './js/i18n.js';
import { initLiveStatus, setSchedule } from './js/live-status.js';
import { initHours } from './js/hours.js';
import { initGallery } from './js/gallery.js';
import { initNav } from './js/nav.js';

const yearEl = document.querySelector('[data-current-year]');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

initLangMenu();
initLiveStatus();
initGallery();
initNav();
initHours().then(s => { if (s) setSchedule(s); });

document.querySelectorAll('[data-copy]').forEach(btn => {
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      const label = btn.querySelector('span');
      if (!label) return;
      const original = label.textContent;
      label.textContent = '✓';
      setTimeout(() => { label.textContent = original; }, 1200);
    } catch {
      /* clipboard unavailable — silent no-op */
    }
  });
});
