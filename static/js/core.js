// core.js - shared DOM refs and UI utilities
const stage = document.getElementById("stage");
const SOUND_KEY = 'gemanti-muted';
const PLAYER_NAME_KEY = 'gemanti-player-name';
const fullscreenButton = () => document.getElementById("fullscreenButton");
let questionType = null;
let questionText = null;
let questionAnswer = null;
let makeQuestionButton = null;
let calculatorDisplay = null;
let calculatorKeys = [];

function refreshDomRefs() {
  questionType = document.getElementById("questionType");
  questionText = document.getElementById("questionText");
  questionAnswer = document.getElementById("questionAnswer");
  makeQuestionButton = document.getElementById("makeQuestionButton");
  calculatorDisplay = questionAnswer || document.querySelector(".calculator-display");
  calculatorKeys = Array.from(document.querySelectorAll(".calculator-key"));
}

refreshDomRefs();

function safeLocalStorageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function safeLocalStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    return false;
  }
}

function getStoredPlayerName() {
  return safeLocalStorageGet(PLAYER_NAME_KEY) || '';
}

function getPlayerNameOrDefault() {
  const storedName = getStoredPlayerName().trim();
  const name = storedName || 'Kamu';
  window.playerName = name;
  return name;
}

function setPlayerName(name) {
  const cleaned = (name || '').trim() || 'Kamu';
  window.playerName = cleaned;
  safeLocalStorageSet(PLAYER_NAME_KEY, cleaned);
  return cleaned;
}

function hasSeenIntroVideo() {
  return safeLocalStorageGet('gemanti-intro-video-seen') === 'true';
}

function markIntroVideoSeen() {
  safeLocalStorageSet('gemanti-intro-video-seen', 'true');
}

function getIntroVideoElements() {
  return {
    overlay: document.getElementById('introVideoOverlay'),
    video: document.getElementById('introVideo'),
    skip: document.getElementById('introVideoSkip'),
  };
}

function showIntroVideo(onFinished) {
  const { overlay, video } = getIntroVideoElements();
  if (!overlay || !video) {
    onFinished();
    return;
  }

  const showOverlay = () => {
    overlay.classList.remove('hidden');
    overlay.style.display = 'flex';
    overlay.style.visibility = 'visible';
    overlay.setAttribute('aria-hidden', 'false');
  };

  const hideOverlay = () => {
    overlay.classList.add('hidden');
    overlay.style.display = 'none';
    overlay.style.visibility = 'hidden';
    overlay.setAttribute('aria-hidden', 'true');
  };

  video.controls = false;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.preload = 'auto';

  const finish = () => {
    hideOverlay();
    video.pause();
    video.currentTime = 0;
    video.controls = true;
    markIntroVideoSeen();
    cleanup();
    onFinished();
  };

  const handleError = () => {
    finish();
  };

  const cleanup = () => {
    video.removeEventListener('ended', finish);
    video.removeEventListener('error', handleError);
    startButton.removeEventListener('click', handleStartClick);
  };

  const handleStartClick = () => {
    video.muted = false;
    video.removeAttribute('muted');
    video.volume = 1;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        showOverlay();
      }).catch(() => {
        console.warn('Intro video play failed');
      });
    }
  };

  const startButton = document.getElementById('introVideoStartButton');
  if (startButton) {
    startButton.addEventListener('click', handleStartClick);
  }

  video.addEventListener('ended', finish);
  video.addEventListener('error', handleError, { once: true });

  showOverlay();

  if (video.readyState < 3) {
    video.load();
  }
}

function initNameInputPage() {
  const nameInput = document.getElementById('playerNameInput');
  const nameForm = document.getElementById('playerNameForm');
  const storedName = getStoredPlayerName().trim();

  if (nameInput) {
    nameInput.value = storedName;
    nameInput.focus();
  }

  const navigateHome = () => {
    window.location.href = '/home';
  };

  const handleSubmitName = (event) => {
    if (event) event.preventDefault();
    if (!nameInput) return;
    setPlayerName(nameInput.value);
    navigateHome();
  };

  const showIntroThenFocus = () => {
    showIntroVideo(() => {
      if (nameInput) nameInput.focus();
    });
  };

  if (nameForm && !nameForm.dataset.nameSubmitHandled) {
    nameForm.addEventListener('submit', handleSubmitName);
    nameForm.dataset.nameSubmitHandled = 'true';
  }

  showIntroThenFocus();
}

function getSoundButtons() {
  return Array.from(document.querySelectorAll('#soundButton'));
}

function getSoundIcons() {
  return Array.from(document.querySelectorAll('#soundIcon'));
}

function getSoundStorageKey() {
  return `${SOUND_KEY}:${window.location.pathname}`;
}

getPlayerNameOrDefault();

let muted = false;
let currentGameMode = "addition";
let currentQuestionType = 1;
let currentQuestionRepeat = 1;
let currentQuestionAnswer = null;
let currentUserEntry = "";
let isSubmittingAnswer = false;
let completionRedirect = false;
let audioContext = null;
let feedbackAudio = null;
let backgroundAudio = null;

const viewClasses = {
  home: "",
  menu: "main-menu-open",
  profile: "profile-open",
  description: "description-open",
  component: "component-open",
  note: "note-open",
  questionMenu: "question-menu-open",
  randomQuestion: "random-question-open",
};

function showView(viewName) {
  const selectedView = viewClasses[viewName] !== undefined ? viewName : "home";

  Object.values(viewClasses).forEach((className) => {
    if (className) stage.classList.remove(className);
  });

  if (viewClasses[selectedView]) stage.classList.add(viewClasses[selectedView]);

  const nextHash = selectedView === "home" ? "" : `#${selectedView}`;
  if (window.location.hash !== nextHash) {
    history.replaceState(null, "", `${window.location.pathname}${nextHash}`);
  }
}

function getFullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
}

function requestStageFullscreen() {
  const requestFullscreen = stage.requestFullscreen || stage.webkitRequestFullscreen || stage.msRequestFullscreen;
  return requestFullscreen.call(stage);
}

function exitPageFullscreen() {
  const exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
  return exitFullscreen.call(document);
}

function updateFullscreenButton() {
  const button = fullscreenButton();
  if (!button) return;
  const isFullscreen = Boolean(getFullscreenElement());
  button.classList.toggle("is-hidden", isFullscreen);
  button.setAttribute("aria-label", isFullscreen ? "Keluar dari layar penuh" : "Buka layar penuh");
}

function initFullscreenControl() {
  const button = fullscreenButton();
  if (!button) return;
  button.removeEventListener('click', toggleFullscreen);
  button.addEventListener('click', toggleFullscreen);
  updateFullscreenButton();
}

async function toggleFullscreen() {
  try {
    if (!getFullscreenElement()) {
      await requestStageFullscreen();
    } else {
      await exitPageFullscreen();
    }
    updateFullscreenButton();
  } catch (error) {
    console.warn("Fullscreen tidak dapat diaktifkan:", error);
  }
}

function loadMutedState() {
  try {
    const stored = localStorage.getItem(getSoundStorageKey());
    if (stored !== null) muted = stored === 'true';
  } catch (e) {
    console.warn('localStorage unavailable', e);
  }
}

function saveMutedState() {
  try {
    localStorage.setItem(getSoundStorageKey(), String(muted));
  } catch (e) {
    /* ignore */
  }
}

function updateSoundUI() {
  getSoundIcons().forEach((icon) => {
    if (!icon) return;
    icon.src = muted ? "/static/img/speaker_non_aktif.png" : "/static/img/speaker_aktif.png";
  });

  getSoundButtons().forEach((btn) => {
    if (!btn) return;
    btn.setAttribute("aria-label", muted ? "Nyalakan suara" : "Matikan suara");
  });

  if (muted) stage.classList.add('muted'); else stage.classList.remove('muted');
}

function initSoundControl() {
  const buttons = getSoundButtons();
  buttons.forEach((btn) => {
    btn.removeEventListener('click', toggleSound);
    btn.addEventListener('click', toggleSound);
  });
}

function toggleSound() {
  muted = !muted;
  saveMutedState();
  updateSoundUI();

  if (backgroundAudio) {
    backgroundAudio.muted = muted;
  }
}

function getAudioContext() {
  if (!audioContext) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return null;
    audioContext = new AudioCtor();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}

function playFeedbackSound(kind, playCount = 1) {
  const audioMap = {
    correct: ['/static/audio/suara_benar.mpeg'],
    correctAlt: ['/static/audio/suara_bener_2.mpeg'],
    wrong: ['/static/audio/suara_salah.mpeg'],
    complete: ['/static/audio/suara_selesai.mpeg'],
  };

  if (playCount < 1) return;

  const sources = [];
  if (kind === 'correct' && playCount > 1) {
    sources.push(...audioMap.correct);
    sources.push(...audioMap.correctAlt);
  } else {
    const candidates = audioMap[kind];
    if (!candidates || !candidates.length) return;
    sources.push(...candidates);
  }

  sources.slice(0, playCount).forEach((src) => {
    const audio = new Audio(src);
    audio.volume = 1;
    audio.play().catch(() => {});
  });
}

function playBackgroundGameAudio() {
  if (!backgroundAudio) {
    backgroundAudio = new Audio('/static/audio/suara_musik.mpeg');
    backgroundAudio.loop = true;
    backgroundAudio.volume = 0.7;
    backgroundAudio.muted = muted;
  }

  if (backgroundAudio.paused) {
    backgroundAudio.play().catch(() => {});
  }
}

loadMutedState();

// Fullscreen wiring (if available)
if (stage.requestFullscreen || stage.webkitRequestFullscreen || stage.msRequestFullscreen) {
  document.addEventListener('fullscreenchange', updateFullscreenButton);
  document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
  document.addEventListener('MSFullscreenChange', updateFullscreenButton);
}

// expose some utilities globally (used by other modules)
window.gemanti = window.gemanti || {};
Object.assign(window.gemanti, {
  showView,
  updateSoundUI,
  updateFullscreenButton,
  initFullscreenControl,
  initSoundControl,
  refreshDomRefs,
  playFeedbackSound,
  playBackgroundGameAudio,
});
