export function initNav() {
  wireMobileMenu();
  wireScrollSpy();
  wireFabVisibility();
}

function wireMobileMenu() {
  const toggle = document.querySelector('.site-nav__toggle');
  const menu = document.getElementById('nav-menu');
  if (!toggle || !menu) return;

  const close = () => {
    menu.dataset.open = 'false';
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };
  const open = () => {
    menu.dataset.open = 'true';
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  toggle.addEventListener('click', () => {
    menu.dataset.open === 'true' ? close() : open();
  });

  menu.addEventListener('click', e => {
    if (e.target.closest('a')) close();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.dataset.open === 'true') close();
  });

  const mq = matchMedia('(min-width: 900px)');
  mq.addEventListener('change', close);
}

function wireScrollSpy() {
  const links = document.querySelectorAll('.site-nav__list a[href^="#"]');
  if (!links.length || !('IntersectionObserver' in window)) return;

  const byId = new Map();
  links.forEach(a => {
    const id = a.getAttribute('href').slice(1);
    byId.set(id, a);
  });

  const sections = Array.from(byId.keys())
    .map(id => document.getElementById(id))
    .filter(Boolean);

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        byId.forEach(a => a.removeAttribute('aria-current'));
        byId.get(entry.target.id)?.setAttribute('aria-current', 'true');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

  sections.forEach(s => io.observe(s));
}

function wireFabVisibility() {
  const fab = document.querySelector('[data-fab-call]');
  const contact = document.getElementById('contact');
  const hero = document.getElementById('hero');
  if (!fab || !contact || !hero || !('IntersectionObserver' in window)) return;

  fab.dataset.hidden = 'true';

  new IntersectionObserver(([e]) => {
    fab.dataset.hidden = String(e.isIntersecting);
  }, { threshold: 0.3 }).observe(hero);

  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) fab.dataset.hidden = 'true';
  }, { threshold: 0.1 }).observe(contact);
}
