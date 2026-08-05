// game.js - question generation, calculator and game logic
function angkaPositif() {
  return Math.floor(Math.random() * 3) + 1;
}

function angkaNegatif() {
  return -(Math.floor(Math.random() * 5) + 1);
}

function angkaPositifKecil() {
  return Math.floor(Math.random() * 3) + 1;
}

function angkaPositifBesar() {
  return Math.floor(Math.random() * 3) + 1;
}

function angkaNegatifKecil() {
  return -(Math.floor(Math.random() * 5) + 1);
}

function angkaNegatifBesar() {
  return -(Math.floor(Math.random() * 5) + 1);
}

function getFeedbackModal() {
  return document.getElementById("feedbackModal");
}

function getFeedbackModalMessage() {
  return document.getElementById("feedbackModalMessage");
}

function getFeedbackModalButton() {
  return document.getElementById("feedbackModalButton");
}

function getHelpVideoButton() {
  return document.getElementById("helpVideoButton");
}

function getHelpVideoContainer() {
  return document.getElementById("helpVideoContainer");
}

function getQuestionTypeElement() {
  return document.getElementById("questionType");
}

function getQuestionTextElement() {
  return document.getElementById("questionText");
}

function getCalculatorDisplay() {
  return document.getElementById("questionAnswer") || document.querySelector(".calculator-display");
}

function toggleHelpVideo(show) {
  const helpVideoContainer = getHelpVideoContainer();
  if (!helpVideoContainer) return;
  const isHidden = helpVideoContainer.classList.contains("hidden");
  const shouldShow = typeof show === "boolean" ? show : isHidden;
  if (shouldShow) {
    const calculatorPanel = document.querySelector('.calculator-panel');
    if (calculatorPanel && !calculatorPanel.classList.contains('hidden')) {
      calculatorPanel.classList.add('hidden');
      if (window.updateMakeQuestionButton) window.updateMakeQuestionButton();
      if (window.updateSubmitButtonVisibility) window.updateSubmitButtonVisibility();
    }
  }
  helpVideoContainer.classList.toggle("hidden", !shouldShow);
  const helpVideoButton = getHelpVideoButton();
  if (helpVideoButton) {
    helpVideoButton.textContent = shouldShow ? "Tutup Bantuan" : "Bantuan";
  }
  const video = helpVideoContainer.querySelector("video");
  if (!video) return;
  if (shouldShow) {
    video.currentTime = 0;
    video.play().catch(() => {});
  } else {
    video.pause();
  }
}

function getHelpVideoSourcePath() {
  const mode = currentGameMode === "subtraction" ? "pengurangan" : "penjumlahan";
  let type = Math.max(1, Math.min(8, currentQuestionType));
  if (mode === 'pengurangan') {
    // Subtraction has 8 internal types, but help videos are grouped into 4 categories.
    type = Math.ceil(type / 2);
  } else {
    type = Math.min(type, 4);
  }
  return `/static/video/vidio_bantuan_${mode}_tipe_${type}.mp4`;
}

function updateHelpVideoSource() {
  const helpVideoContainer = getHelpVideoContainer();
  if (!helpVideoContainer) return;
  const video = helpVideoContainer.querySelector("video");
  const source = helpVideoContainer.querySelector("source");
  if (!video || !source) return;
  source.src = getHelpVideoSourcePath();
  video.load();
}

function personalizeMessage(message) {
  const name = window.playerName || 'Kamu';
  const trimmedName = name.trim() || 'Kamu';
  const containsName = trimmedName !== 'Kamu' && message.includes(trimmedName);
  const containsKamu = /\bKamu\b|\bkamu\b/.test(message);
  if (containsName && !containsKamu) {
    return message;
  }
  return message
    .replace(/\bKamu\b/g, trimmedName)
    .replace(/\bkamu\b/g, trimmedName.toLowerCase());
}

function showFeedback(message, type = "success", buttonText = null) {
  const feedbackModal = getFeedbackModal();
  const feedbackModalMessage = getFeedbackModalMessage();
  const feedbackModalButton = getFeedbackModalButton();

  const finalMessage = personalizeMessage(message);

  if (!feedbackModal || !feedbackModalMessage) {
    alert(finalMessage);
    return;
  }

  if (feedbackModalButton) {
    if (type === "error") {
      feedbackModalButton.textContent = buttonText || "Coba lagi";
    } else if (buttonText) {
      feedbackModalButton.textContent = buttonText;
    } else if (message.includes("Yupss Benar")) {
      feedbackModalButton.textContent = "Lanjut";
    } else {
      feedbackModalButton.textContent = "Lanjut tipe berikutnya";
    }
  }

  feedbackModalMessage.textContent = finalMessage;
  feedbackModal.classList.toggle("feedback-modal--success", type === "success");
  feedbackModal.classList.toggle("feedback-modal--error", type === "error");
  feedbackModal.classList.add("feedback-modal--show");
  feedbackModal.setAttribute("aria-hidden", "false");
}

function createConfettiBurst() {
  const colors = ['#FFD166', '#06D6A0', '#118AB2', '#EF476F', '#FFB4A2'];
  const count = 14;
  const container = document.createElement('div');
  container.className = 'confetti-burst';
  container.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.className = 'confetti-piece';
    const color = colors[Math.floor(Math.random() * colors.length)];
    el.style.background = color;
    el.style.left = `${50 + (Math.random() - 0.5) * 40}%`;
    el.style.transform = `translateY(0) rotate(${Math.random() * 360}deg)`;
    container.appendChild(el);
  }
  document.body.appendChild(container);
  // remove after animation
  setTimeout(() => { container.remove(); }, 1600);
}

function hideFeedback() {
  const feedbackModal = getFeedbackModal();
  const feedbackModalButton = getFeedbackModalButton();
  if (!feedbackModal) return;

  feedbackModal.classList.remove("feedback-modal--show", "feedback-modal--success", "feedback-modal--error");
  feedbackModal.setAttribute("aria-hidden", "true");
  if (completionRedirect) {
    completionRedirect = false;
    if (window.gemanti && typeof window.gemanti.loadPage === 'function') {
      window.gemanti.loadPage("/permainan");
    } else {
      window.location.href = "/permainan";
    }
    return;
  }
  if (feedbackModalButton) {
    feedbackModalButton.textContent = "Lanjut";
  }
}

function initFeedbackModalButton() {
  const feedbackModalButton = getFeedbackModalButton();
  if (feedbackModalButton) {
    feedbackModalButton.removeEventListener("click", hideFeedback);
    feedbackModalButton.addEventListener("click", hideFeedback);
  }
}

function formatAngka(n) {
  return n < 0 ? `(${n})` : `${n}`;
}

function formatAngkaKedua(n) {
  return n < 0 ? `(${n})` : `${n}`;
}

function buatPasanganAngkaBerbeda(generatorA, generatorB) {
  let a = generatorA();
  let b = generatorB();

  while (a === b) {
    a = generatorA();
    b = generatorB();
  }

  return [a, b];
}

function buatSoal(pilihanTipe = 1) {
  let a = 0;
  let b = 0;
  let namaTipe = "";

  if (currentGameMode === "addition") {
    switch (pilihanTipe) {
      case 1:
        [a, b] = buatPasanganAngkaBerbeda(angkaPositif, angkaPositif);
        namaTipe = "Tipe 1: positif + positif";
        break;
      case 2:
        [a, b] = buatPasanganAngkaBerbeda(angkaNegatif, angkaNegatif);
        namaTipe = "Tipe 2: negatif + negatif";
        break;
      case 3:
        [a, b] = buatPasanganAngkaBerbeda(angkaPositif, angkaNegatif);
        namaTipe = "Tipe 3: positif + negatif";
        break;
      default:
        [a, b] = buatPasanganAngkaBerbeda(angkaNegatif, angkaPositif);
        namaTipe = "Tipe 4: negatif + positif";
        break;
    }
  } else {
    switch (pilihanTipe) {
      case 1:
        [a, b] = buatPasanganAngkaBerbeda(angkaPositifBesar, angkaPositifKecil);
        namaTipe = "Tipe 1a: positif - positif";
        break;
      case 2:
        [a, b] = buatPasanganAngkaBerbeda(angkaPositifKecil, angkaPositifBesar);
        namaTipe = "Tipe 1b: positif - positif";
        break;
      case 3:
        [a, b] = buatPasanganAngkaBerbeda(angkaPositifBesar, angkaNegatifKecil);
        namaTipe = "Tipe 2a: positif - negatif";
        break;
      case 4:
        [a, b] = buatPasanganAngkaBerbeda(angkaPositifKecil, angkaNegatifBesar);
        namaTipe = "Tipe 2b: positif - negatif";
        break;
      case 5:
        [a, b] = buatPasanganAngkaBerbeda(angkaNegatifBesar, angkaNegatifKecil);
        namaTipe = "Tipe 3a: negatif - negatif";
        break;
      case 6:
        [a, b] = buatPasanganAngkaBerbeda(angkaNegatifKecil, angkaNegatifBesar);
        namaTipe = "Tipe 3b: negatif - negatif";
        break;
      case 7:
        [a, b] = buatPasanganAngkaBerbeda(angkaNegatifBesar, angkaPositifKecil);
        namaTipe = "Tipe 4a: negatif - positif";
        break;
      default:
        [a, b] = buatPasanganAngkaBerbeda(angkaNegatifKecil, angkaPositifBesar);
        namaTipe = "Tipe 4b: negatif - positif";
        break;
    }

    // Pastikan relasi besar/kecil hanya untuk pasangan dengan tanda sama.
    // Untuk tipe 1 dan 5: angka pertama harus memiliki nilai mutlak lebih besar dari angka kedua.
    // Untuk tipe 2 dan 6: angka pertama harus memiliki nilai mutlak lebih kecil dari angka kedua.
    if ([1, 5].includes(pilihanTipe) && Math.abs(a) <= Math.abs(b)) {
      const tmp = a; a = b; b = tmp;
    }
    if ([2, 6].includes(pilihanTipe) && Math.abs(a) >= Math.abs(b)) {
      const tmp = a; a = b; b = tmp;
    }
  }

  const operator = currentGameMode === "addition" ? "+" : "-";
  const jawaban = currentGameMode === "addition" ? a + b : a - b;

  return {
    tipe: pilihanTipe,
    namaTipe,
    angkaPertama: a,
    angkaKedua: b,
    jawaban,
    teksSoal: `${formatAngka(a)} ${operator} ${formatAngkaKedua(b)} = ?`,
  };
}

function tampilkanSoal(tipe = currentQuestionType) {
  currentQuestionType = tipe;
  const soal = buatSoal(currentQuestionType);

  currentQuestionAnswer = soal.jawaban;
  currentUserEntry = "";

  if (questionType) questionType.textContent = soal.namaTipe;
  if (questionText) questionText.textContent = `${soal.teksSoal.split("=")[0].trim()} =`;
  if (calculatorDisplay) calculatorDisplay.textContent = "...";
  const calculatorPanel = document.querySelector('.calculator-panel');
  if (calculatorPanel) {
    calculatorPanel.classList.add('hidden');
    if (window.updateMakeQuestionButton) window.updateMakeQuestionButton();
    if (window.updateSubmitButtonVisibility) window.updateSubmitButtonVisibility();
  }
  updateHelpVideoSource();
  toggleHelpVideo(false);
}

function updateCalculatorDisplay() {
  const displayValue = currentUserEntry || "...";
  if (calculatorDisplay) {
    calculatorDisplay.textContent = displayValue;
  }
}

function updateAnswerField() {
  if (!calculatorDisplay) return;
  calculatorDisplay.textContent = currentUserEntry || "...";
}

function handleCalculatorInput(key) {
  if (key === "Hapus") {
    currentUserEntry = currentUserEntry.slice(0, -1);
    updateCalculatorDisplay();
    updateAnswerField();
    return;
  }

  if (key === "-") {
    if (currentUserEntry === "") {
      currentUserEntry = "-";
    } else if (currentUserEntry === "-") {
      currentUserEntry = "";
    }
    updateCalculatorDisplay();
    updateAnswerField();
    return;
  }

  if (/^[0-9]$/.test(key)) {
    if (currentUserEntry === "0") {
      currentUserEntry = key;
    } else {
      currentUserEntry += key;
    }
    updateCalculatorDisplay();
    updateAnswerField();
  }
}

function submitAnswer() {
  if (typeof isSubmittingAnswer !== 'undefined' && isSubmittingAnswer) return;
  isSubmittingAnswer = true;
  if (currentQuestionAnswer === null) { isSubmittingAnswer = false; return; }
  if (currentUserEntry === "" || currentUserEntry === "-") {
    if (window.resetHelpers) window.resetHelpers();
    isSubmittingAnswer = false;
    return;
  }

  const enteredValue = Number(currentUserEntry);
  if (!Number.isFinite(enteredValue)) {
    if (window.resetHelpers) window.resetHelpers();
    isSubmittingAnswer = false;
    return;
  }

  if (enteredValue === currentQuestionAnswer) {
    const prevType = currentQuestionType;
    const wasFirstTry = currentQuestionRepeat === 1;
    const resolvedGameMode = currentGameMode || (window.location.pathname.includes("/permainan/pengurangan") ? "subtraction" : (window.location.pathname.includes("/permainan/penjumlahan") ? "addition" : "addition"));
    let finishedAllQuestions = false;
    if (resolvedGameMode === "subtraction") {
      if (currentQuestionRepeat < 5) {
        currentQuestionRepeat += 1;
      } else if (currentQuestionType < 8) {
        currentQuestionRepeat = 1;
        currentQuestionType += 1;
      } else {
        finishedAllQuestions = true;
      }
    } else {
      if (currentQuestionRepeat < 5) {
        currentQuestionRepeat += 1;
      } else if (currentQuestionType < 4) {
        currentQuestionRepeat = 1;
        currentQuestionType += 1;
      } else {
        finishedAllQuestions = true;
      }
    }

    if (finishedAllQuestions) {
      const playerName = window.playerName || 'Kamu';
      const completionMessage = resolvedGameMode === "addition"
      ? `Woow Keren👍🏻👍🏻👍🏻\n${playerName} sudah menguasai\nPENJUMLAHAN pada Bilangan Bulat`
      : `Hebat, ${playerName}! sudah menyelesaikan semua soal. Teruskan belajar dan kembali ke Permainan.`;
      if (window.gemanti && typeof window.gemanti.playFeedbackSound === 'function') {
        window.gemanti.playFeedbackSound('complete');
      }

      showFeedback(completionMessage, "success", "Lanjut ke Permainan");
      try {
        createConfettiBurst();
        const celebrationGlow = document.createElement('div');
        celebrationGlow.className = 'celebration-glow';
        document.body.appendChild(celebrationGlow);
        setTimeout(() => celebrationGlow.remove(), 1200);
      } catch (e) { /* ignore */ }
      completionRedirect = true;
    } else {
      const advanced = currentQuestionType !== prevType;
      const playerName = window.playerName || 'Kamu';
      if (advanced) {
        if (window.gemanti && typeof window.gemanti.playFeedbackSound === 'function') {
          window.gemanti.playFeedbackSound('correctAlt');
        }
        showFeedback(`Hebat, ${playerName}! sudah menaklukan soal TIPE ${prevType}`, "success");
      } else {
        if (window.gemanti && typeof window.gemanti.playFeedbackSound === 'function') {
          window.gemanti.playFeedbackSound('correct');
        }
        showFeedback(`Jawaban Benar, ${playerName}!`, "success", "lanjut");
      }
      tampilkanSoal(currentQuestionType);
    }

    if (window.resetHelpers) window.resetHelpers();
    isSubmittingAnswer = false;
  } else {
    const playerName = window.playerName || 'Kamu';
    const msg = `Wah, ${playerName}! Jawabanmu salah 🤭`;
    if (window.gemanti && typeof window.gemanti.playFeedbackSound === 'function') {
      window.gemanti.playFeedbackSound('wrong');
    }
    showFeedback(msg, "error");
    currentUserEntry = "";
    tampilkanSoal(currentQuestionType);
    if (window.resetHelpers) window.resetHelpers();
    isSubmittingAnswer = false;
  }
}

function initPermainanGame() {
  currentQuestionRepeat = 1;
  const pathname = window.location.pathname || window.location.href;
  if (pathname.includes("/permainan/penjumlahan")) {
    currentGameMode = "addition";
    currentQuestionType = 1;
    tampilkanSoal(currentQuestionType);
  } else if (pathname.includes("/permainan/pengurangan")) {
    currentGameMode = "subtraction";
    currentQuestionType = 1;
    currentQuestionRepeat = 1;
    tampilkanSoal(currentQuestionType);
  }
}

// expose some functions globally
window.buatSoal = buatSoal;
window.tampilkanSoal = tampilkanSoal;
window.submitAnswer = submitAnswer;
window.handleCalculatorInput = handleCalculatorInput;
window.initPermainanGame = initPermainanGame;
