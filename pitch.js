const tabs = [...document.querySelectorAll('.tab')];
const pages = [...document.querySelectorAll('.page')];
const hotspots = [...document.querySelectorAll('.hotspot')];
const viewer = document.getElementById('viewer');
const viewerTitle = document.getElementById('viewerTitle');
const viewerImage = document.getElementById('viewerImage');
const themeToggle = document.getElementById('themeToggle');
const THEME_KEY = 'wprojekt-theme';

function resolveInitialTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === 'dark' || savedTheme === 'light') {
    return savedTheme;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.body.dataset.theme = isDark ? 'dark' : 'light';
  themeToggle.setAttribute('aria-pressed', String(isDark));
  themeToggle.textContent = isDark ? '🌙 Dark Mode' : '☀️ Light Mode';
}

function toggleTheme() {
  const nextTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
  localStorage.setItem(THEME_KEY, nextTheme);
}

function showPage(targetId) {
  pages.forEach((page) => page.classList.toggle('active', page.id === targetId));
  tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.target === targetId));
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => showPage(tab.dataset.target));
});

applyTheme(resolveInitialTheme());
themeToggle.addEventListener('click', toggleTheme);

hotspots.forEach((hotspot) => {
  hotspot.addEventListener('click', () => {
    viewerTitle.textContent = hotspot.dataset.title;
    viewerImage.src = hotspot.dataset.image;
    viewerImage.alt = hotspot.dataset.title;
    viewer.showModal();
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && viewer.open) {
    viewer.close();
  }
});
