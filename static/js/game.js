// game.js - question generation, calculator and game logic
function angkaPositif() {
  return Math.floor(Math.random() * 5) + 1;
}

function angkaNegatif() {
  return -(Math.floor(Math.random() * 5) + 1);
}

function angkaPositifKecil() {
  return Math.floor(Math.random() * 4) + 1;
}

function angkaPositifBesar() {
  return Math.floor(Math.random() * 5) + 1;
}

function angkaNegatifKecil() {
  return -(Math.floor(Math.random() * 4) + 1);
}

function angkaNegatifBesar() {
  return -(Math.floor(Math.random() * 5) + 1);
}

const feedbackModal = document.getElementById("feedbackModal");
const feedbackModalMessage = document.getElementById("feedbackModalMessage");
const feedbackModalButton = document.getElementById("feedbackModalButton");

function showFeedback(message, type = "success") {
  if (!feedbackModal || !feedbackModalMessage) {
    alert(message);
    return;
  }

  feedbackModalMessage.textContent = message;
  feedbackModal.classList.toggle("feedback-modal--success", type === "success");
  feedbackModal.classList.toggle("feedback-modal--error", type === "error");
  feedbackModal.classList.add("feedback-modal--show");
  feedbackModal.setAttribute("aria-hidden", "false");
}

function hideFeedback() {
  if (!feedbackModal) return;
  feedbackModal.classList.remove("feedback-modal--show", "feedback-modal--success", "feedback-modal--error");
  feedbackModal.setAttribute("aria-hidden", "true");
}

if (feedbackModalButton) {
  feedbackModalButton.addEventListener("click", hideFeedback);
}

function formatAngka(n) {
  return n >= 0 ? `+${n}`.replace(/^\+/, '') : `${n}`;
}

function buatSoal(pilihanTipe = 1) {
  let a = 0;
  let b = 0;
  let namaTipe = "";

  if (currentGameMode === "addition") {
    switch (pilihanTipe) {
      case 1:
        a = angkaPositif();
        b = angkaPositif();
        namaTipe = "Tipe 1: positif + positif";
        break;
      case 2:
        a = angkaNegatif();
        b = angkaNegatif();
        namaTipe = "Tipe 2: negatif + negatif";
        break;
      case 3:
        a = angkaPositif();
        b = angkaNegatif();
        namaTipe = "Tipe 3: positif + negatif";
        break;
      default:
        a = angkaNegatif();
        b = angkaPositif();
        namaTipe = "Tipe 4: negatif + positif";
        break;
    }
  } else {
    switch (pilihanTipe) {
      case 1:
        a = angkaPositifBesar();
        b = angkaPositifKecil();
        namaTipe = "Tipe 1: besar (+) - kecil (+)";
        break;
      case 2:
        a = angkaPositifKecil();
        b = angkaPositifBesar();
        namaTipe = "Tipe 2: kecil (+) - besar (+)";
        break;
      case 3:
        a = angkaPositifBesar();
        b = angkaNegatifKecil();
        namaTipe = "Tipe 3: besar (+) - kecil (-)";
        break;
      case 4:
        a = angkaPositifKecil();
        b = angkaNegatifBesar();
        namaTipe = "Tipe 4: kecil (+) - besar (-)";
        break;
      case 5:
        a = angkaNegatifBesar();
        b = angkaNegatifKecil();
        namaTipe = "Tipe 5: besar (-) - kecil (-)";
        break;
      case 6:
        a = angkaNegatifKecil();
        b = angkaNegatifBesar();
        namaTipe = "Tipe 6: kecil (-) - besar (-)";
        break;
      case 7:
        a = angkaNegatifBesar();
        b = angkaPositifKecil();
        namaTipe = "Tipe 7: besar (-) - kecil (+)";
        break;
      default:
        a = angkaNegatifKecil();
        b = angkaPositifBesar();
        namaTipe = "Tipe 8: kecil (-) - besar (+)";
        break;
    }

    // Pastikan relasi besar/kecil berdasarkan tipe:
    // Untuk tipe 1,3,5,7: angka pertama harus memiliki nilai mutlak lebih besar dari angka kedua.
    // Untuk tipe 2,4,6,8: angka pertama harus memiliki nilai mutlak lebih kecil dari angka kedua.
    const mustAGTB = [1, 3, 5, 7].includes(pilihanTipe);
    const mustALTb = [2, 4, 6, 8].includes(pilihanTipe);
    if (mustAGTB && Math.abs(a) <= Math.abs(b)) {
      const tmp = a; a = b; b = tmp;
    }
    if (mustALTb && Math.abs(a) >= Math.abs(b)) {
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
    teksSoal: `(${formatAngka(a)}) ${operator} (${formatAngka(b)}) = ?`,
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
  }
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
    return;
  }

  if (enteredValue === currentQuestionAnswer) {
    showFeedback("Jawaban benar! Lanjut ke soal berikutnya.", "success");
    const resolvedGameMode = currentGameMode || (window.location.pathname.includes("/dolanan/pengurangan") ? "subtraction" : (window.location.pathname.includes("/dolanan/penjumlahan") ? "addition" : "addition"));
    if (resolvedGameMode === "subtraction") {
      // Untuk pengurangan: setiap tipe soal diulang 2 kali (seperti penjumlahan),
      // lalu lanjut ke tipe berikutnya. Soal tetap random dalam tiap tipe.
      if (currentQuestionRepeat < 2) {
        currentQuestionRepeat += 1;
      } else {
        currentQuestionRepeat = 1;
        currentQuestionType = currentQuestionType < 8 ? currentQuestionType + 1 : 1;
      }
    } else {
      if (currentQuestionRepeat < 2) {
        currentQuestionRepeat += 1;
      } else {
        currentQuestionRepeat = 1;
        currentQuestionType = currentQuestionType < 4 ? currentQuestionType + 1 : 1;
      }
    }
    tampilkanSoal(currentQuestionType);
    if (window.resetHelpers) window.resetHelpers();
    isSubmittingAnswer = false;
  } else {
    showFeedback("Jawaban salah. Soal baru dibuat dalam tipe yang sama.", "error");
    currentUserEntry = "";
    tampilkanSoal(currentQuestionType);
    if (window.resetHelpers) window.resetHelpers();
    isSubmittingAnswer = false;
  }
}

function initDolananGame() {
  currentQuestionRepeat = 1;
  const pathname = window.location.pathname || window.location.href;
  if (pathname.includes("/dolanan/penjumlahan")) {
    currentGameMode = "addition";
    currentQuestionType = 1;
    tampilkanSoal(currentQuestionType);
  } else if (pathname.includes("/dolanan/pengurangan")) {
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
window.initDolananGame = initDolananGame;
