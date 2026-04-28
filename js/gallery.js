export function initGallery() {
  const dialog = document.querySelector('[data-lightbox]');
  const imgEl = document.querySelector('[data-lightbox-image]');
  const prevBtn = document.querySelector('[data-lightbox-prev]');
  const nextBtn = document.querySelector('[data-lightbox-next]');
  const closeBtn = document.querySelector('[data-lightbox-close]');
  const items = Array.from(document.querySelectorAll('.gallery__item'));
  if (!dialog || !imgEl || !items.length) return;

  const sources = items.map(btn => {
    const img = btn.querySelector('img');
    const caption = btn.querySelector('.sr-only')?.textContent || '';
    return { src: img?.src || '', alt: caption };
  });

  let index = 0;

  const show = i => {
    index = (i + sources.length) % sources.length;
    const s = sources[index];
    imgEl.src = s.src;
    imgEl.alt = s.alt;
  };

  items.forEach(btn => {
    btn.addEventListener('click', () => {
      show(Number(btn.dataset.galleryIndex) || 0);
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    });
  });

  prevBtn?.addEventListener('click', () => show(index - 1));
  nextBtn?.addEventListener('click', () => show(index + 1));
  closeBtn?.addEventListener('click', () => dialog.close());

  dialog.addEventListener('click', e => {
    if (e.target === dialog) dialog.close();
  });

  document.addEventListener('keydown', e => {
    if (!dialog.open) return;
    if (e.key === 'ArrowLeft')  show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });
}
