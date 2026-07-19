// brain-split.js - drag-and-snap interaction for "brain" elements
;(function initBrainSplit() {
  const MIN = 0;
  const MAX = 50;
  const STEP = 10;

  function snapValue(value) {
    const rounded = Math.round(value / STEP) * STEP;
    return Math.max(MIN, Math.min(MAX, rounded));
  }

  function applyTransforms(el, mag, animate) {
    const left = el.querySelector('.brain-left');
    const right = el.querySelector('.brain-right');
    if (!left || !right) return;

    if (animate) {
      el.classList.add('snap-anim');
      window.clearTimeout(el._snapTimeout);
      el._snapTimeout = window.setTimeout(() => el.classList.remove('snap-anim'), 300);
    }

    left.style.transform = `translateX(${ -Math.abs(mag) }px)`;
    right.style.transform = `translateX(${ Math.abs(mag) }px)`;
    el.dataset.level = String(Math.abs(mag));
  }

  const brains = Array.from(document.querySelectorAll('.brain'));
  brains.forEach((brain) => {
    brain.dataset.level = brain.dataset.level || '0';

    let pointerId = null;
    let startX = 0;
    let startLevel = 0;

    brain.addEventListener('pointerdown', (ev) => {
      if (ev.button && ev.button !== 0) return;
      ev.preventDefault();
      pointerId = ev.pointerId;
      brain.setPointerCapture(pointerId);
      brain.classList.add('dragging');
      startX = ev.clientX;
      startLevel = Number(brain.dataset.level || 0);
    });

    brain.addEventListener('pointermove', (ev) => {
      if (pointerId === null || ev.pointerId !== pointerId) return;
      ev.preventDefault();
      const delta = ev.clientX - startX;
      const raw = startLevel + delta;
      const mag = Math.max(MIN, Math.min(MAX, Math.round(raw)));
      applyTransforms(brain, mag, false);
    });

    function endDrag(ev) {
      if (pointerId === null || (ev && ev.pointerId !== pointerId)) return;
      if (ev) ev.preventDefault();
      const current = Number(brain.dataset.level || 0);
      const snapped = snapValue(current);
      brain.classList.remove('dragging');
      applyTransforms(brain, snapped, true);
      try { brain.releasePointerCapture(pointerId); } catch (e) { }
      pointerId = null;
    }

    brain.addEventListener('pointerup', endDrag);
    brain.addEventListener('pointercancel', endDrag);

    applyTransforms(brain, 0, false);
  });

  window.resetBrains = function () {
    brains.forEach((b) => applyTransforms(b, 0, true));
  };
})();
