// init.js - attach UI event listeners and initialize modules
(function () {
  const stage = document.getElementById('stage');

  function getCalculatorDisplay() {
    return document.getElementById('questionAnswer') || document.querySelector('.calculator-display');
  }

  function getCalculatorPanel() {
    return document.querySelector('.calculator-panel');
  }

  function getSubmitAnswerRow() {
    return document.getElementById('submitAnswerRow');
  }

  function getSubmitAnswerButton() {
    return document.getElementById('submitAnswerButton');
  }

  function updateSubmitButtonVisibility() {
    const submitAnswerRow = getSubmitAnswerRow();
    const calculatorPanel = getCalculatorPanel();
    if (!submitAnswerRow || !calculatorPanel) return;
    submitAnswerRow.classList.toggle('hidden', calculatorPanel.classList.contains('hidden'));
  }

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
    // Ensure the global base stylesheet is present. Some navigation paths
    // may return HTML without the base CSS link, so add it if missing.
    try {
      const hasBase = Array.from(document.head.querySelectorAll('link[rel="stylesheet"]')).some(l => l.href && l.href.endsWith('/static/css/base.css'));
      if (!hasBase) {
        const baseLink = document.createElement('link');
        baseLink.rel = 'stylesheet';
        baseLink.href = '/static/css/base.css';
        // mark as dynamic so future navigations can remove/re-add correctly
        baseLink.dataset.dynamicStyle = 'true';
        document.head.appendChild(baseLink);
      }
    } catch (e) {
      // ignore errors — best-effort fallback
    }
  }

  function syncBodyPageClass(url = window.location.href) {
    try {
      const pathname = new URL(url, window.location.href).pathname;
      const isHomePage = pathname === '/home' || pathname === '/';
      const isNamaPage = pathname === '/nama';

      document.body.classList.remove('page-home', 'page-nama');

      if (isHomePage) {
        document.body.classList.add('page-home');
      } else if (isNamaPage) {
        document.body.classList.add('page-nama');
      }
    } catch (error) {
      document.body.classList.remove('page-home', 'page-nama');
    }
  }

  function runPageInit() {
    if (window.gemanti && typeof window.gemanti.refreshDomRefs === 'function') window.gemanti.refreshDomRefs();
    if (window.gemanti && typeof window.gemanti.updateSoundUI === 'function') window.gemanti.updateSoundUI();
    if (window.gemanti && typeof window.gemanti.playBackgroundGameAudio === 'function') window.gemanti.playBackgroundGameAudio();
    if (window.gemanti && typeof window.gemanti.initSoundControl === 'function') window.gemanti.initSoundControl();
    if (typeof updateSubmitButtonVisibility === 'function') updateSubmitButtonVisibility();
    if (typeof toggleHelpVideo === 'function') toggleHelpVideo(false);
    if (typeof initPermainanGame === 'function') initPermainanGame();
    if (typeof initDragHelpers === 'function') initDragHelpers();
    if (window.gemanti && typeof window.gemanti.initFullscreenControl === 'function') window.gemanti.initFullscreenControl();
    if (typeof initFeedbackModalButton === 'function') initFeedbackModalButton();
    if (typeof initNameInputPage === 'function' && document.getElementById('playerNameForm')) initNameInputPage();
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

      const targetUrl = new URL(url, window.location.href);
      const targetPath = targetUrl.pathname;
      const isSamePath = targetPath === window.location.pathname;

      updateDynamicStyles(doc);
      stage.innerHTML = newStage.innerHTML;

      // Execute scripts from the fetched document in order so inline initialization runs
      const scripts = Array.from(newStage.querySelectorAll('script'));
      for (const s of scripts) {
        try {
          if (s.src) {
            // external script: recreate and wait for it to load
            await new Promise((res) => {
              const scriptEl = document.createElement('script');
              scriptEl.src = s.src;
              if (s.type) scriptEl.type = s.type;
              scriptEl.addEventListener('load', () => res(), { once: true });
              scriptEl.addEventListener('error', () => res(), { once: true });
              document.body.appendChild(scriptEl);
            });
          } else {
            // inline script: execute immediately
            const scriptEl = document.createElement('script');
            if (s.type) scriptEl.type = s.type;
            scriptEl.textContent = s.textContent || s.innerText || '';
            document.body.appendChild(scriptEl);
          }
        } catch (e) {
          // ignore script execution errors to avoid breaking navigation
        }
      }

      // Wait for dynamically-inserted stylesheets to load, and for images inside the stage to finish loading
      const waitForResources = async () => {
        const dynamicLinks = Array.from(document.head.querySelectorAll('link[data-dynamic-style]'));
        const linkPromises = dynamicLinks.map(link => new Promise((res) => {
          if (link.sheet) return res();
          link.addEventListener('load', () => res(), { once: true });
          link.addEventListener('error', () => res(), { once: true });
        }));

        const imgs = Array.from(stage.querySelectorAll('img'));
        const imgPromises = imgs.map(img => new Promise((res) => {
          if (img.complete) return res();
          img.addEventListener('load', () => res(), { once: true });
          img.addEventListener('error', () => res(), { once: true });
        }));

        await Promise.all([...linkPromises, ...imgPromises]);
      };

      await waitForResources();
      syncBodyPageClass(url);

      if (replaceHistory === 'replace') {
        history.replaceState({ path: url }, '', url);
      } else if (replaceHistory) {
        if (isSamePath) {
          history.replaceState({ path: url }, '', url);
        } else {
          history.pushState({ path: url }, '', url);
        }
      }

      runPageInit();
    } catch (error) {
      window.location.href = url;
    }
  }

  function handleBodyClick(event) {
    const anchor = event.target.closest('a');
    if (anchor && isSameOriginLink(anchor)) {
      // If user clicked the main start button, set session flag and allow full navigation
      try {
        if (anchor.id === 'menuButton') {
          sessionStorage.setItem('gemanti-intro-auto', '1');
          // Let the browser perform a normal navigation so the user gesture remains valid for autoplay
          return;
        }
      } catch (e) {}

      // For other in-app links, intercept and load via fetch-based navigation
      event.preventDefault();
      loadPage(anchor.href);
      return;
    }

    const button = event.target.closest('button');
    if (!button) return;

    if (button.id === 'soundButton') {
      event.preventDefault();
      if (typeof toggleSound === 'function') {
        toggleSound();
      }
      return;
    }

    if (button.id === 'profileButton') {
      event.preventDefault();
      if (window.location.pathname !== '/menu') {
        loadPage('/menu');
      }
      return;
    }

    if (button.id === 'fullscreenButton') {
      // Fullscreen is handled separately in core.js; do not treat it as navigation.
      return;
    }

    if (button.classList.contains('top-action')) {
      event.preventDefault();
      if (window.location.pathname !== '/menu') {
        loadPage('/menu');
      }
      return;
    }

    if (button.id === 'helpVideoButton') {
      event.preventDefault();
      if (typeof toggleHelpVideo === 'function') toggleHelpVideo();
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
    if (path === window.location.pathname) return;
    loadPage(path, false);
  });

  syncBodyPageClass(window.location.href);
  runPageInit();
})();
