export function initLangMenu() {
  const toggle = document.querySelector('.lang-switcher__current');
  const menu = document.getElementById('lang-menu');
  if (!toggle || !menu) return;

  const close = () => {
    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
  };
  const open = () => {
    menu.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
  };

  toggle.addEventListener('click', e => {
    e.stopPropagation();
    menu.hidden ? open() : close();
  });

  menu.addEventListener('click', e => {
    if (e.target.closest('a')) close();
  });

  document.addEventListener('click', e => {
    if (!menu.hidden && !menu.contains(e.target) && e.target !== toggle) close();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !menu.hidden) { close(); toggle.focus(); }
  });
}
