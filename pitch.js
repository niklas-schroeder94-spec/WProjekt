const slides = [...document.querySelectorAll('.slide')];
const counter = document.getElementById('counter');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const printBtn = document.getElementById('printBtn');

let index = 0;

function render() {
  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === index);
  });

  counter.textContent = `${index + 1} / ${slides.length}`;
  document.title = `Pitch Deck – ${slides[index].dataset.title}`;
}

function next() {
  index = Math.min(slides.length - 1, index + 1);
  render();
}

function prev() {
  index = Math.max(0, index - 1);
  render();
}

nextBtn.addEventListener('click', next);
prevBtn.addEventListener('click', prev);
printBtn.addEventListener('click', () => window.print());

document.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight' || event.key === 'PageDown') {
    next();
  }
  if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
    prev();
  }
  if (event.key.toLowerCase() === 'p') {
    window.print();
  }
});

render();
