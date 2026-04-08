const slides = [...document.querySelectorAll('.slide')];
const dotNav = document.getElementById('dotNav');
const counter = document.getElementById('slideCounter');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

let current = 0;
const charts = {};

const zeroLinePlugin = {
  id: 'zeroLinePlugin',
  afterDraw(chart) {
    const {ctx, chartArea, scales} = chart;
    if (!scales.y) return;
    const y0 = scales.y.getPixelForValue(0);
    ctx.save();
    ctx.setLineDash([4,4]);
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(chartArea.left, y0);
    ctx.lineTo(chartArea.right, y0);
    ctx.stroke();
    ctx.setLineDash([]);
    const x13 = scales.x.getPixelForValue(13);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x13, y0, 4, 0, Math.PI*2);
    ctx.fill();
    ctx.fillText('Break-Even', x13 + 8, y0 - 8);
    ctx.restore();
  }
};



function initInteractivePulses() {
  document.querySelectorAll('.building.interactive').forEach((group) => {
    const rect = group.querySelector('rect');
    if (!rect || group.querySelector('circle.pulse')) return;
    const x = Number(rect.getAttribute('x'));
    const y = Number(rect.getAttribute('y'));
    const w = Number(rect.getAttribute('width'));
    const h = Number(rect.getAttribute('height'));
    const pulse = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    pulse.setAttribute('class', 'pulse');
    pulse.setAttribute('cx', String(x + w / 2));
    pulse.setAttribute('cy', String(y + h / 2));
    pulse.setAttribute('r', String(Math.max(w, h) * 0.38));
    group.appendChild(pulse);
  });
}

slides.forEach((_, i) => {
  const dot = document.createElement('button');
  dot.className = 'dot';
  dot.setAttribute('aria-label', `Slide ${i + 1}`);
  dot.addEventListener('click', () => showSlide(i));
  dotNav.appendChild(dot);
});

function showSlide(i) {
  current = Math.max(0, Math.min(slides.length - 1, i));
  slides.forEach((s, idx) => s.classList.toggle('active', idx === current));
  [...dotNav.children].forEach((d, idx) => d.classList.toggle('active', idx === current));
  counter.textContent = `${current + 1} / ${slides.length}`;
  lazyInitCharts();
}

prevBtn.addEventListener('click', () => showSlide(current - 1));
nextBtn.addEventListener('click', () => showSlide(current + 1));

const overlayPanel = document.getElementById('overlayPanel');
const overlayTitle = document.getElementById('overlayTitle');
const overlayImage = document.getElementById('overlayImage');
const closeOverlay = document.getElementById('closeOverlay');

function openDetail(target) {
  const config = {
    stoff: { title: 'Stoffaufbereitung – Umbau', image: './Stoffaufbereitung_Umbau.png' },
    pm: { title: 'Umbau Papiermaschine', image: './Papiermaschine_Umbau.png' }
  }[target];
  if (!config) return;
  overlayTitle.textContent = config.title;
  overlayImage.src = config.image;
  overlayPanel.classList.add('open');
}

document.querySelectorAll('[data-target="stoff"], [data-target="pm"]').forEach((el) => {
  el.addEventListener('click', () => openDetail(el.dataset.target));
});
closeOverlay.addEventListener('click', () => overlayPanel.classList.remove('open'));

function lazyInitCharts() {
  if (current === 1 && !charts.cashflow && window.Chart) {
    const years = Array.from({ length: 25 }, (_, i) => i + 1);
    const values = [-264,-241,-218,-196,-173,-151,-129,-107,-86,-65,-44,-24,-4,16,36,55,73,92,109,127,144,160,176,192,207];
    charts.cashflow = new Chart(document.getElementById('cashflowChart'), {
      type: 'line',
      data: { labels: years, datasets: [{ data: values, borderColor: '#fff', borderWidth: 2, tension: .4, fill: true, backgroundColor: 'rgba(37,99,235,.15)', pointRadius: 0 }] },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#a1a1aa' }, grid: { color: '#3f3f46' } }, y: { ticks: { color: '#a1a1aa' }, grid: { color: '#3f3f46' } } } }, plugins: [zeroLinePlugin]
    });
    charts.opex = new Chart(document.getElementById('opexChart'), {
      type: 'bar',
      data: { labels: ['Bestand', 'Umbau'], datasets: [
        { label: 'Rohstoff', data: [138.4,63.2], backgroundColor:'#52525b' },
        { label: 'Veredelungschemie', data: [14.8,127.2], backgroundColor:'#2563EB' },
        { label: 'Energie', data: [30.5,14.5], backgroundColor:'#EF9F27' },
        { label: 'Wasser', data: [11.3,14.2], backgroundColor:'#5DCAA5' },
        { label: 'Personal', data: [8,9.9], backgroundColor:'#7F77DD' },
        { label: 'Sonstiges', data: [5,5], backgroundColor:'#888780' }
      ] },
      options: { indexAxis: 'y', scales: { x: { stacked: true, ticks: { color: '#a1a1aa' }, grid: { color: '#3f3f46' } }, y: { stacked: true, ticks: { color: '#a1a1aa' }, grid: { color: '#3f3f46' } } }, plugins: { legend: { labels: { color: '#d4d4d8' } } } }
    });
  }

  if (current === 2 && !charts.pcf && window.Chart) {
    charts.pcf = new Chart(document.getElementById('pcfChart'), {
      type: 'bar',
      data: {
        labels: ['Rohstoff', 'Energie Strom', 'Energie Dampf/Gas', 'Streichkomponenten', 'Wasser', 'Entsorgung', 'Hilfsstoff'],
        datasets: [
          { label: 'Bestand', data: [0.04125,0.01524,0.00778,0.00360,0.00134,0.00090,0.00097], backgroundColor:'rgba(255,255,255,.7)' },
          { label: 'Umbau', data: [0.00372,0.00000,0.00185,0.02860,0.00162,0.00013,0.00010], backgroundColor:'rgba(37,99,235,.85)' }
        ]
      },
      options: { indexAxis: 'y', plugins: { legend: { labels: { color: '#d4d4d8' } } }, scales: { x: { ticks: { color: '#a1a1aa' }, grid: { color: '#3f3f46' } }, y: { ticks: { color: '#a1a1aa' }, grid: { color: '#3f3f46' } } } }
    });
  }
}


document.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight' || event.key === 'PageDown') showSlide(current + 1);
  if (event.key === 'ArrowLeft' || event.key === 'PageUp') showSlide(current - 1);
  if (event.key.toLowerCase() === 'f') {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }
});

initInteractivePulses();
showSlide(0);
