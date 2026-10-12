export function setupSlides({ onShowThreeD }) {
  let activeSlide = 0;
  const slidePanels = [...document.querySelectorAll('[data-slide-panel]')];
  const slideTabs = [...document.querySelectorAll('.slide-tab')];
  const slideTriggers = [...document.querySelectorAll('[data-slide-target]')];

  function setSlide(index) {
    const next = Math.max(0, Math.min(slidePanels.length - 1, Number(index)));
    activeSlide = next;

    slidePanels.forEach((panel, i) => panel.classList.toggle('is-active', i === next));
    slideTabs.forEach((tab, i) => tab.classList.toggle('is-active', i === next));
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (next === 0) {
      requestAnimationFrame(onShowThreeD);
    }
  }

  slideTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => setSlide(trigger.dataset.slideTarget));
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight' && activeSlide < slidePanels.length - 1) {
      setSlide(activeSlide + 1);
    }
    if (event.key === 'ArrowLeft' && activeSlide > 0) {
      setSlide(activeSlide - 1);
    }
  });

  return {
    getActiveSlide: () => activeSlide,
    setSlide,
  };
}
