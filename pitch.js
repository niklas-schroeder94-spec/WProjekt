const tabs = [...document.querySelectorAll('.tab')];
const pages = [...document.querySelectorAll('.page')];
const hotspots = [...document.querySelectorAll('.hotspot')];
const viewer = document.getElementById('viewer');
const viewerTitle = document.getElementById('viewerTitle');
const viewerImage = document.getElementById('viewerImage');

function showPage(targetId) {
  pages.forEach((page) => page.classList.toggle('active', page.id === targetId));
  tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.target === targetId));
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => showPage(tab.dataset.target));
});

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
