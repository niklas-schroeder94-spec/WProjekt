const slides = [...document.querySelectorAll('.slide')];
const dotNav = document.getElementById('dotNav');
const counter = document.getElementById('slideCounter');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const themeBtn = document.getElementById('themeBtn');
const progressBar = document.getElementById('progressBar');

let current = 0;
let scenario = 'standard';
const charts = {};
const scenarioInputs = { energy: 0, co2: 150, market: 100 };

const cashflowStandard = [-264,-241,-218,-196,-173,-151,-129,-107,-86,-65,-44,-24,-4,16,36,55,73,92,109,127,144,160,176,192,207];
const cashflowCo2 = [-250,-220,-190,-160,-130,-100,-70,-40,-12,10,30,49,67,84,101,117,133,148,163,177,191,204,217,229,241];

const externalTooltipHandler = (context) => {
  const { chart, tooltip } = context;
  let el = chart.canvas.parentNode.querySelector('.chart-tooltip');
  if (!el) {
    el = document.createElement('div');
    el.className = 'chart-tooltip';
    Object.assign(el.style, {
      position: 'absolute', pointerEvents: 'none', background: 'rgba(12,12,12,.92)', border: '1px solid rgba(255,255,255,.16)',
      borderRadius: '10px', padding: '8px 10px', color: '#fff', fontSize: '12px', transition: 'all .12s ease', zIndex: 30
    });
    chart.canvas.parentNode.style.position = 'relative';
    chart.canvas.parentNode.appendChild(el);
  }
  if (tooltip.opacity === 0) { el.style.opacity = 0; return; }
  if (tooltip.body) {
    const title = tooltip.title[0] || '';
    const body = tooltip.body.map((b) => b.lines.join(' ')).join('<br/>');
    el.innerHTML = `<strong>${title}</strong><br/>${body}`;
  }
  const { offsetLeft, offsetTop } = chart.canvas;
  el.style.opacity = 1;
  el.style.left = `${offsetLeft + tooltip.caretX + 12}px`;
  el.style.top = `${offsetTop + tooltip.caretY - 12}px`;
};

const zeroLinePlugin = {
  id: 'zeroLinePlugin',
  afterDraw(chart) {
    const {ctx, chartArea, scales} = chart;
    if (!scales.y || !scales.x) return;
    const y0 = scales.y.getPixelForValue(0);
    ctx.save();
    ctx.setLineDash([4,4]);
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(chartArea.left, y0);
    ctx.lineTo(chartArea.right, y0);
    ctx.stroke();
    ctx.setLineDash([]);
    const breakEvenYear = scenario === 'co2' ? 9 : 13;
    const x = scales.x.getPixelForValue(breakEvenYear);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(x, y0, 4, 0, Math.PI*2); ctx.fill();
    ctx.fillText('Break-Even', x + 8, y0 - 8);
    ctx.restore();
  }
};


function applyTheme(theme) {
  const light = theme === 'light';
  document.body.classList.toggle('theme-light', light);
  themeBtn.setAttribute('aria-pressed', String(light));
  themeBtn.textContent = light ? '☾ Dark' : '☀︎ Light';
}

function initThemeToggle() {
  const stored = localStorage.getItem('pitchTheme') || 'dark';
  applyTheme(stored);
  themeBtn.addEventListener('click', () => {
    const next = document.body.classList.contains('theme-light') ? 'dark' : 'light';
    localStorage.setItem('pitchTheme', next);
    applyTheme(next);
  });
}

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
  progressBar.style.width = `${((current + 1) / slides.length) * 100}%`;
  lazyInitCharts();
  revealOnSlide();
  if (slides[current].dataset.title === 'Product Carbon Footprint') animateImpact();
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
  setSankeyActive(target === "stoff");
}

document.querySelectorAll('[data-target="stoff"], [data-target="pm"]').forEach((el) => {
  el.addEventListener('click', () => openDetail(el.dataset.target));
});
closeOverlay.addEventListener('click', () => { overlayPanel.classList.remove('open'); setSankeyActive(false); });

function initScenarioToggle() {
  document.querySelectorAll('[data-scenario]').forEach((btn) => {
    btn.addEventListener('click', () => {
      scenario = btn.dataset.scenario;
      document.querySelectorAll('[data-scenario]').forEach((b) => b.classList.toggle('active', b === btn));
      if (charts.cashflow) {
        charts.cashflow.data.datasets[0].data = getScenarioCashflow();
        charts.cashflow.update();
      }
    });
  });
}


function getScenarioCashflow() {
  const base = scenario === 'co2' ? cashflowCo2 : cashflowStandard;
  const e = scenarioInputs.energy / 100;
  const c = (scenarioInputs.co2 - 150) / 150;
  const m = (scenarioInputs.market - 100) / 100;
  return base.map((v, i) => Math.round(v + (i + 1) * (2.2 * c + 1.6 * m - 1.4 * e)));
}

function initConfigurator() {
  const energy = document.getElementById('energyRange');
  const co2 = document.getElementById('co2Range');
  const market = document.getElementById('marketRange');
  const energyVal = document.getElementById('energyVal');
  const co2Val = document.getElementById('co2Val');
  const marketVal = document.getElementById('marketVal');
  if (!energy || !co2 || !market) return;
  const update = () => {
    scenarioInputs.energy = Number(energy.value);
    scenarioInputs.co2 = Number(co2.value);
    scenarioInputs.market = Number(market.value);
    energyVal.textContent = `${scenarioInputs.energy}%`;
    co2Val.textContent = `${scenarioInputs.co2} €/t`;
    marketVal.textContent = `${scenarioInputs.market}%`;
    if (charts.cashflow) {
      charts.cashflow.data.datasets[0].data = getScenarioCashflow();
      charts.cashflow.update();
    }
  };
  [energy, co2, market].forEach((el) => el.addEventListener('input', update));
  update();
}

function initMicroscope() {
  const box = document.getElementById('microscope');
  const lens = document.getElementById('lens');
  const zoom = lens?.querySelector('.zoom-layer');
  if (!box || !lens || !zoom) return;
  box.addEventListener('mousemove', (e) => {
    const r = box.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    lens.style.transform = `translate(${x - 70}px, ${y - 70}px)`;
    zoom.style.transform = `translate(${-x * 1.7 + 70}px, ${-y * 1.7 + 70}px)`;
  });
  box.addEventListener('mouseleave', () => lens.style.transform = 'translate(-999px,-999px)');
}

function initBendTest() {
  const range = document.getElementById('bendRange');
  const sheet = document.getElementById('paperSheet');
  const kit = document.getElementById('kitVal');
  if (!range || !sheet || !kit) return;
  range.addEventListener('input', () => {
    const v = Number(range.value);
    sheet.style.transform = `rotateY(${-v * 0.45}deg) rotateX(${v * 0.08}deg)`;
    const integrity = Math.max(82, Math.round(100 - v * 0.18));
    kit.textContent = `${integrity}%`;
  });
}


function setSankeyActive(on) {
  ['flowForward','flowSteam'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('active', on);
  });
}

function initBarrierBuilder() {
  const checks = [...document.querySelectorAll('.layer-toggle')];
  const otr = document.getElementById('otrValue');
  const box = otr?.closest('.otr-box');
  if (!checks.length || !otr || !box) return;
  const calc = () => {
    let value = 18;
    const active = Object.fromEntries(checks.map((c) => [c.dataset.layer, c.checked]));
    if (!active.chitosan) value += 22;
    if (!active.pha) value += 12;
    if (!active.top) value += 8;
    otr.textContent = String(value);
    box.classList.toggle('warn', value > 30);
  };
  checks.forEach((c) => c.addEventListener('change', calc));
  calc();
}


function initSlotDieAnimationControl() {
  const card = document.querySelector('.slotdie-anim-card');
  const slider = document.getElementById('speedRange');
  if (!card || !slider) return;
  const setSpeed = (v) => card.style.setProperty('--speed', String(v));
  setSpeed(slider.value);
  slider.addEventListener('input', () => setSpeed(slider.value));
  card.addEventListener('mouseenter', () => setSpeed(Number(slider.value) * 1.25));
  card.addEventListener('mouseleave', () => setSpeed(slider.value));
}

function initScrollStory() {
  let lock = false;
  window.addEventListener('wheel', (e) => {
    if (lock) return;
    if (Math.abs(e.deltaY) < 25) return;
    lock = true;
    showSlide(current + (e.deltaY > 0 ? 1 : -1));
    setTimeout(() => (lock = false), 420);
  }, { passive: true });
}

function revealOnSlide() {
  const slide = slides[current];
  slide.querySelectorAll('.card, .kpi-grid, details').forEach((el, i) => {
    el.classList.add('reveal-item');
    setTimeout(() => el.classList.add('revealed'), i * 30);
  });
}

function lazyInitCharts() {
  if (current === 2 && !charts.cashflow && window.Chart) {
    const years = Array.from({ length: 25 }, (_, i) => i + 1);
    charts.cashflow = new Chart(document.getElementById('cashflowChart'), {
      type: 'line',
      data: { labels: years, datasets: [{ data: getScenarioCashflow(), borderColor: '#fff', borderWidth: 2, tension: .4, fill: true, backgroundColor: 'rgba(37,99,235,.15)', pointRadius: 0 }] },
      options: {
        responsive: true,
        plugins: { legend: { display: false }, tooltip: { enabled: false, external: externalTooltipHandler } },
        scales: { x: { ticks: { color: '#a1a1aa' }, grid: { display: false } }, y: { ticks: { color: '#a1a1aa' }, grid: { display: false } } }
      },
      plugins: [zeroLinePlugin]
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
      options: { indexAxis: 'y', scales: { x: { stacked: true, ticks: { color: '#a1a1aa' }, grid: { display: false } }, y: { stacked: true, ticks: { color: '#a1a1aa' }, grid: { display: false } } }, plugins: { legend: { labels: { color: '#d4d4d8' } }, tooltip: { enabled: false, external: externalTooltipHandler } } }
    });
  }

  if (current === 3 && !charts.pcf && window.Chart) {
    charts.pcf = new Chart(document.getElementById('pcfChart'), {
      type: 'bar',
      data: {
        labels: ['Bestand', 'Hebel Energie', 'Hebel Rohstoffe', 'Umbau'],
        datasets: [
          { label: 'Floater', data: [0, 0.071, 0.05576, 0], backgroundColor: 'rgba(0,0,0,0)', stack: 'combined' },
          { label: 'Impact', data: [0.071, -0.01524, -0.02204, 0.034], backgroundColor: ['rgba(255,255,255,.7)', 'rgba(37,99,235,.55)', 'rgba(37,99,235,.85)', 'rgba(255,255,255,.9)'], stack: 'combined' }
        ]
      },
      options: { plugins: { legend: { labels: { color: '#d4d4d8' } }, tooltip: { enabled: false, external: externalTooltipHandler } }, scales: { x: { ticks: { color: '#a1a1aa' }, grid: { display: false } }, y: { ticks: { color: '#a1a1aa' }, grid: { display: false } } } }
    });
  }
}

function initLayerTooltips() {
  const tooltip = document.createElement('div');
  tooltip.className = 'layer-tooltip';
  document.body.appendChild(tooltip);
  document.querySelectorAll('.layer-item').forEach((el) => {
    el.addEventListener('mouseenter', () => { tooltip.textContent = el.dataset.tip || ''; tooltip.style.opacity = 1; });
    el.addEventListener('mousemove', (e) => { tooltip.style.left = `${e.clientX + 12}px`; tooltip.style.top = `${e.clientY + 12}px`; });
    el.addEventListener('mouseleave', () => { tooltip.style.opacity = 0; });
  });
}

let impactDone = false;
function animateImpact() {
  if (impactDone) return;
  impactDone = true;
  const el = document.getElementById('impactCounter');
  if (!el) return;
  let n = 0;
  const target = 50000;
  const step = () => {
    n += 900;
    if (n >= target) { el.textContent = target.toLocaleString('de-DE'); return; }
    el.textContent = n.toLocaleString('de-DE');
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight' || event.key === 'PageDown') showSlide(current + 1);
  if (event.key === 'ArrowLeft' || event.key === 'PageUp') showSlide(current - 1);
  if (event.key.toLowerCase() === 'f') {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }
});

initThemeToggle();
initInteractivePulses();
initScenarioToggle();
initConfigurator();
initMicroscope();
initBendTest();
initLayerTooltips();
initBarrierBuilder();
initSlotDieAnimationControl();
initScrollStory();
showSlide(0);
