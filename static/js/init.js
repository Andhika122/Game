// init.js - attach UI event listeners and initialize modules
(function () {
  const stage = document.getElementById('stage');

  function getCalculatorDisplay() {
    return document.getElementById('questionAnswer') || document.querySelector('.calculator-display');
  }

  function getCalculatorPanel() {
    return document.querySelector('.calculator-panel');
  }

  function getMakeQuestionButton() {
    return document.getElementById('makeQuestionButton');
  }

  function getSubmitAnswerRow() {
    return document.getElementById('submitAnswerRow');
  }

  function getSubmitAnswerButton() {
    return document.getElementById('submitAnswerButton');
  }

  function updateMakeQuestionButton() {
    const button = getMakeQuestionButton();
    const calculatorPanel = getCalculatorPanel();
    if (!button || !calculatorPanel) return;
    button.textContent = calculatorPanel.classList.contains('hidden') ? 'Jawaban' : 'Tutup Jawaban';
  }

  function updateSubmitButtonVisibility() {
    const submitAnswerRow = getSubmitAnswerRow();
    const calculatorPanel = getCalculatorPanel();
    if (!submitAnswerRow || !calculatorPanel) return;
    submitAnswerRow.classList.toggle('hidden', calculatorPanel.classList.contains('hidden'));
  }

  window.updateMakeQuestionButton = updateMakeQuestionButton;
  window.updateSubmitButtonVisibility = updateSubmitButtonVisibility;

  function isSameOriginLink(anchor) {
    if (!anchor || !anchor.href) return false;
    if (anchor.target && anchor.target !== '_self') return false;
    if (anchor.hasAttribute('download')) return false;
    const url = new URL(anchor.href, window.location.href);
    return url.origin === window.location.origin && url.pathname !== window.location.pathname;
  }

  function updateDynamicStyles(doc) {
    const existingStyles = document.head.querySelectorAll('link[data-dynamic-style]');
    existingStyles.forEach((link) => link.remove());

    const newStyles = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'))
      .filter((link) => link.href && !link.href.endsWith('/static/css/base.css'));

    newStyles.forEach((link) => {
      const styleLink = document.createElement('link');
      styleLink.rel = 'stylesheet';
      styleLink.href = link.href;
      styleLink.dataset.dynamicStyle = 'true';
      document.head.appendChild(styleLink);
    });
  }

  function runPageInit() {
    if (window.gemanti && typeof window.gemanti.refreshDomRefs === 'function') window.gemanti.refreshDomRefs();
    if (window.gemanti && typeof window.gemanti.updateSoundUI === 'function') window.gemanti.updateSoundUI();
    if (window.gemanti && typeof window.gemanti.playBackgroundGameAudio === 'function') window.gemanti.playBackgroundGameAudio();
    if (window.gemanti && typeof window.gemanti.initSoundControl === 'function') window.gemanti.initSoundControl();
    if (typeof updateMakeQuestionButton === 'function') updateMakeQuestionButton();
    if (typeof updateSubmitButtonVisibility === 'function') updateSubmitButtonVisibility();
    if (typeof toggleHelpVideo === 'function') toggleHelpVideo(false);
    if (typeof initPermainanGame === 'function') initPermainanGame();
    if (typeof initDragHelpers === 'function') initDragHelpers();
    if (window.gemanti && typeof window.gemanti.initFullscreenControl === 'function') window.gemanti.initFullscreenControl();
    if (typeof initFeedbackModalButton === 'function') initFeedbackModalButton();
  }

  window.gemanti = window.gemanti || {};
  Object.assign(window.gemanti, {
    loadPage,
  });

  async function loadPage(url, replaceHistory = true) {
    if (!stage) {
      window.location.href = url;
      return;
    }

    try {
      const response = await fetch(url, { headers: { 'X-Requested-With': 'Fetch' } });
      if (!response.ok) {
        window.location.href = url;
        return;
      }

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const newStage = doc.getElementById('stage');
      if (!newStage) {
        window.location.href = url;
        return;
      }

      const newTitle = doc.querySelector('title');
      if (newTitle) document.title = newTitle.textContent;

      updateDynamicStyles(doc);
      stage.innerHTML = newStage.innerHTML;
      if (replaceHistory) history.pushState({ path: url }, '', url);
      runPageInit();
    } catch (error) {
      window.location.href = url;
    }
  }

  function handleBodyClick(event) {
    const anchor = event.target.closest('a');
    if (anchor && isSameOriginLink(anchor)) {
      event.preventDefault();
      loadPage(anchor.href);
      return;
    }

    const button = event.target.closest('button');
    if (!button) return;

    if (button.id === 'profileButton') {
      event.preventDefault();
      loadPage('/');
      return;
    }

    if (button.id === 'helpVideoButton') {
      event.preventDefault();
      if (typeof toggleHelpVideo === 'function') toggleHelpVideo();
      return;
    }

    if (button.id === 'makeQuestionButton') {
      event.preventDefault();
      const calculatorPanel = getCalculatorPanel();
      if (!calculatorPanel) return;
      const openingCalculator = calculatorPanel.classList.contains('hidden');
      calculatorPanel.classList.toggle('hidden');
      if (openingCalculator && typeof toggleHelpVideo === 'function') toggleHelpVideo(false);
      updateMakeQuestionButton();
      updateSubmitButtonVisibility();
      return;
    }

    if (button.id === 'submitAnswerButton') {
      event.preventDefault();
      if (typeof submitAnswer === 'function') submitAnswer();
      return;
    }
  }

  document.body.addEventListener('click', handleBodyClick);

  document.addEventListener('click', (event) => {
    const keyButton = event.target.closest('.calculator-key');
    if (!keyButton) return;
    event.preventDefault();
    const key = keyButton.dataset.key || keyButton.textContent.trim();
    if (typeof handleCalculatorInput === 'function') handleCalculatorInput(key);
  });


  window.addEventListener('popstate', (event) => {
    const path = (event.state && event.state.path) || window.location.pathname;
    loadPage(path, false);
  });

  updateMakeQuestionButton();
  updateSubmitButtonVisibility();

  if (window.gemanti && typeof window.gemanti.updateSoundUI === 'function') window.gemanti.updateSoundUI();
  if (typeof initPermainanGame === 'function') initPermainanGame();
  if (typeof initDragHelpers === 'function') initDragHelpers();
  if (typeof initFeedbackModalButton === 'function') initFeedbackModalButton();
})();
