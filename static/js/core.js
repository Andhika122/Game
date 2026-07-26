// core.js - shared DOM refs and UI utilities
const stage = document.getElementById("stage");
const SOUND_KEY = 'gemanti-muted';
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

function getSoundButtons() {
  return Array.from(document.querySelectorAll('#soundButton'));
}

function getSoundIcons() {
  return Array.from(document.querySelectorAll('#soundIcon'));
}

function getSoundStorageKey() {
  return `${SOUND_KEY}:${window.location.pathname}`;
}

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
  button.textContent = "FS";
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
    if (muted) {
      backgroundAudio.pause();
    } else {
      backgroundAudio.play().catch(() => {});
    }
  } else if (!muted) {
    playBackgroundGameAudio();
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

function playFeedbackSound(kind) {
  const audioMap = {
    correct: '/static/audio/suara_benar.mpeg',
    wrong: '/static/audio/suara_salah.mpeg',
    complete: '/static/audio/suara_selesai.mpeg',
  };

  const src = audioMap[kind];
  if (!src) return;

  if (feedbackAudio) {
    feedbackAudio.pause();
    feedbackAudio.currentTime = 0;
  }

  feedbackAudio = new Audio(src);
  feedbackAudio.volume = 1;
  feedbackAudio.play().catch(() => {});
}

function playBackgroundGameAudio() {
  if (muted) return;
  if (backgroundAudio) {
    if (backgroundAudio.paused) {
      backgroundAudio.play().catch(() => {});
    }
    return;
  }

  backgroundAudio = new Audio('/static/audio/suara_musik.mpeg');
  backgroundAudio.loop = true;
  backgroundAudio.volume = 0.7;
  backgroundAudio.play().catch(() => {});
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
