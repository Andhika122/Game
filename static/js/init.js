// init.js - attach UI event listeners and initialize modules
(function () {
  // profile/home buttons
  const profileButtons = Array.from(document.querySelectorAll('#profileButton'));
  profileButtons.forEach((btn) => {
    btn.addEventListener('click', () => { window.location.href = '/'; });
  });

  // buttons that show views via data-view
  document.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => {
      const view = button.dataset.view;
      if (view && window.gemanti && window.gemanti.showView) window.gemanti.showView(view);
    });
  });

  // question mode buttons
  document.querySelectorAll('[data-question-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.dataset.questionMode === 'addition') {
        currentQuestionType = 1;
        if (typeof tampilkanSoal === 'function') tampilkanSoal(currentQuestionType);
        if (window.gemanti && window.gemanti.showView) window.gemanti.showView('randomQuestion');
      }
    });
  });

  // calculator keys
  const calcKeys = Array.from(document.querySelectorAll('.calculator-key'));
  calcKeys.forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.dataset.key || button.textContent.trim();
      if (typeof handleCalculatorInput === 'function') handleCalculatorInput(key);
    });
  });

  const calculatorDisplay = document.getElementById('questionAnswer');
  const calculatorPanel = document.querySelector('.calculator-panel');
  const makeQuestionButton = document.getElementById('makeQuestionButton');

  function updateMakeQuestionButton() {
    if (!makeQuestionButton || !calculatorPanel) return;
    makeQuestionButton.textContent = calculatorPanel.classList.contains('hidden') ? 'Jawaban' : 'Submit Jawaban';
  }
  window.updateMakeQuestionButton = updateMakeQuestionButton;

  if (calculatorDisplay && calculatorPanel) {
    calculatorDisplay.addEventListener('click', () => {
      calculatorPanel.classList.toggle('hidden');
      updateMakeQuestionButton();
    });
  }

  if (makeQuestionButton) {
    makeQuestionButton.addEventListener('click', () => {
      if (calculatorPanel && calculatorPanel.classList.contains('hidden')) {
        calculatorPanel.classList.remove('hidden');
        updateMakeQuestionButton();
        return;
      }

      if (typeof submitAnswer === 'function') submitAnswer();
    });
  }

  updateMakeQuestionButton();

  // apply initial UI state
  if (window.gemanti && typeof window.gemanti.updateSoundUI === 'function') window.gemanti.updateSoundUI();

  // initial view and game init
  const initial = window.location.hash.replace('#', '') || 'home';
  if (window.gemanti && window.gemanti.showView) window.gemanti.showView(initial);

  if (typeof initDolananGame === 'function') initDolananGame();
  if (typeof initDragHelpers === 'function') initDragHelpers();
})();
