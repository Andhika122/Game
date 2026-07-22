// core.js - shared DOM refs and UI utilities
const stage = document.getElementById("stage");
// Sound controls: support multiple pages by syncing via localStorage.
const soundButtons = Array.from(document.querySelectorAll('#soundButton'));
const soundIcons = Array.from(document.querySelectorAll('#soundIcon'));
const SOUND_KEY = 'gemanti-muted';
const fullscreenButton = document.getElementById("fullscreenButton");
const questionType = document.getElementById("questionType");
const questionText = document.getElementById("questionText");
const questionAnswer = document.getElementById("questionAnswer");
const makeQuestionButton = document.getElementById("makeQuestionButton");
const calculatorDisplay = questionAnswer || document.querySelector(".calculator-display");
const calculatorKeys = document.querySelectorAll(".calculator-key");

let muted = false;
let currentGameMode = "addition";
let currentQuestionType = 1;
let currentQuestionRepeat = 1;
let currentQuestionAnswer = null;
let currentUserEntry = "";
let isSubmittingAnswer = false;

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
  if (!fullscreenButton) return;
  const isFullscreen = Boolean(getFullscreenElement());
  fullscreenButton.setAttribute("aria-label", isFullscreen ? "Keluar dari layar penuh" : "Buka layar penuh");
  fullscreenButton.textContent = isFullscreen ? "X" : "FS";
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

// Initialize muted from localStorage if present
try {
  const stored = localStorage.getItem(SOUND_KEY);
  if (stored !== null) muted = stored === 'true';
} catch (e) {
  console.warn('localStorage unavailable', e);
}

function updateSoundUI() {
  soundIcons.forEach((icon) => {
    if (!icon) return;
    icon.src = muted ? "/static/img/speaker_non_aktif.png" : "/static/img/speaker_aktif.png";
  });

  soundButtons.forEach((btn) => {
    if (!btn) return;
    btn.setAttribute("aria-label", muted ? "Nyalakan suara" : "Matikan suara");
  });

  if (muted) stage.classList.add('muted'); else stage.classList.remove('muted');
}

// Attach listeners to all sound buttons
soundButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    muted = !muted;
    try { localStorage.setItem(SOUND_KEY, String(muted)); } catch (e) { /* ignore */ }
    updateSoundUI();
  });
});

// Fullscreen wiring (if available)
if (fullscreenButton && (stage.requestFullscreen || stage.webkitRequestFullscreen || stage.msRequestFullscreen)) {
  fullscreenButton.addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', updateFullscreenButton);
  document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
  document.addEventListener('MSFullscreenChange', updateFullscreenButton);
} else if (fullscreenButton) {
  fullscreenButton.hidden = true;
}

// expose some utilities globally (used by other modules)
window.gemanti = window.gemanti || {};
Object.assign(window.gemanti, {
  showView,
  updateSoundUI,
  updateFullscreenButton,
});
