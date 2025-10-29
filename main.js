let quiz = { title: "", topic: "", type: "mc", n: 5, questions: [] };

const step1 = document.querySelector("#step1");
const step2 = document.querySelector("#step2");
const step3 = document.querySelector("#step3");
const savedSection = document.querySelector("#savedSection");
const output = document.querySelector("#output");
const toast = document.querySelector("#toast");

const manualForm = document.querySelector("#manualForm");
const manualPrompt = document.querySelector("#manualPrompt");
const manualOptionsArea = document.querySelector("#manualOptionsArea");
const manualAnswer = document.querySelector("#manualAnswer");

// ---- Toast ----
function showToast(msg) {
  toast.textContent = msg;
  toast.className = "toast show";
  setTimeout(() => (toast.className = "toast hidden"), 2500);
}

// ---- Tema ----
function setTheme(t) {
  document.documentElement.classList.toggle("light", t === "light");
  localStorage.setItem("theme", t);
}
function loadTheme() {
  setTheme(localStorage.getItem("theme") || "dark");
}
loadTheme();

document.querySelector("#themeBtn").onclick = () => {
  const newT = document.documentElement.classList.contains("light")
    ? "dark"
    : "light";
  setTheme(newT);
  showToast(`Tema: ${newT === "light" ? "claro" : "escuro"}`);
};

// ---- Navegação ----
document.querySelector("#homeBtn").onclick = () => {
  savedSection.classList.add("hidden");
  step1.classList.remove("hidden");
};
document.querySelector("#savedBtn").onclick = () => {
  renderSaved();
  savedSection.classList.remove("hidden");
  step1.classList.add("hidden");
  step2.classList.add("hidden");
  step3.classList.add("hidden");
};
document.querySelector("#backHome").onclick = () => {
  savedSection.classList.add("hidden");
  step1.classList.remove("hidden");
};

// ---- Etapa 1 ----
document.querySelector("#next1").onclick = () => {
  quiz.title = document.querySelector("#title").value.trim() || "Quiz";
  quiz.topic = document.querySelector("#topic").value.trim();
  quiz.type = document.querySelector("#type").value;
  quiz.n = parseInt(document.querySelector("#num").value);
  if (!quiz.topic) return showToast("Indica um tema!");
  step1.classList.add("hidden");
  step2.classList.remove("hidden");
};

// ---- IA: gerar perguntas ----
async function generateQuestions() {
  output.textContent = "⏳ A gerar perguntas em tempo real...";
  try {
    const res = await fetch(
      `/api/generate?topic=${encodeURIComponent(quiz.topic)}&type=${quiz.type}&n=${quiz.n}`
    );
    const data = await res.json();
    if (!Array.isArray(data.questions)) throw new Error("Resposta inválida");
    quiz.questions = data.questions;
    output.textContent = JSON.stringify(quiz.questions, null, 2);
    showToast("Perguntas geradas!");
  } catch (err) {
    output.innerHTML = `⚠️ Erro: ${err.message}`;
    showToast("Erro ao gerar perguntas");
  }
}

document.querySelector("#generate").onclick = generateQuestions;
document.querySelector("#regenerate").onclick = () => {
  if (!quiz.topic) return showToast("Define primeiro um tema!");
  generateQuestions();
};

// ---- Adicionar manualmente ----
document.querySelector("#manual").onclick = () => {
  manualForm.classList.toggle("hidden");
  manualOptionsArea.innerHTML = "";

  if (quiz.type === "mc") {
    for (let i = 0; i < 3; i++) addOptionField();
  } else {
    manualOptionsArea.innerHTML =
      "<p class='muted'>Preenche apenas o enunciado e a resposta correta.</p>";
  }
};

// criar campos de opções
function addOptionField(value = "") {
  const div = document.createElement("div");
  div.className = "option-line";

  const input = document.createElement("input");
  input.placeholder = "Opção";
  input.value = value;
  input.className = "manualOpt";

  const radio = document.createElement("input");
  radio.type = "radio";
  radio.name = "correctOpt";

  div.appendChild(radio);
  div.appendChild(input);
  manualOptionsArea.appendChild(div);
}

// guardar pergunta manual
document.querySelector("#saveManual").onclick = () => {
  const q = { type: quiz.type, prompt: manualPrompt.value.trim() };
  if (!q.prompt) return showToast("Escreve a pergunta!");

  if (quiz.type === "mc") {
    const options = Array.from(document.querySelectorAll(".manualOpt"))
      .map((i) => i.value.trim())
      .filter(Boolean);
    const radios = Array.from(document.querySelectorAll('input[name="correctOpt"]'));
    const answerIndex = radios.findIndex((r) => r.checked);

    if (options.length < 2) return showToast("Mínimo 2 opções!");
    if (answerIndex === -1) return showToast("Escolhe a resposta correta!");

    q.options = options;
    q.answer = answerIndex;
  } else {
    q.answer = manualAnswer.value.trim() || "Resposta";
  }

  quiz.questions.push(q);
  output.textContent = JSON.stringify(quiz.questions, null, 2);
  showToast("Pergunta adicionada!");
  manualPrompt.value = "";
  manualAnswer.value = "";
  manualOptionsArea.innerHTML = "";
};

// ---- Revisão ----
document.querySelector("#next2").onclick = () => {
  if (quiz.questions.length === 0) return showToast("Ainda não há perguntas!");
  step2.classList.add("hidden");
  renderQuiz();
  step3.classList.remove("hidden");
};

function renderQuiz() {
  const area = document.querySelector("#playArea");
  area.innerHTML = "";
  quiz.questions.forEach((q, i) => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `<h3>${i + 1}. ${q.prompt}</h3>`;
    if (q.options) {
      q.options.forEach((opt, idx) => {
        const btn = document.createElement("button");
        btn.textContent = opt;
        btn.onclick = () => {
          if (idx === q.answer) btn.style.background = "#10b981";
          else btn.style.background = "#ef4444";
        };
        div.appendChild(btn);
      });
    }
    area.appendChild(div);
  });
}

// ---- Guardar Quiz ----
document.querySelector("#finish").onclick = () => {
  const quizzes = JSON.parse(localStorage.getItem("saved_quizzes") || "[]");
  quizzes.push(quiz);
  localStorage.setItem("saved_quizzes", JSON.stringify(quizzes));
  showToast("Quiz guardado!");
  setTimeout(() => location.reload(), 1000);
};

// ---- Render e apagar quizzes ----
function renderSaved() {
  const list = document.querySelector("#savedList");
  const quizzes = JSON.parse(localStorage.getItem("saved_quizzes") || "[]");
  if (quizzes.length === 0) {
    list.innerHTML = "<p>Sem quizzes guardados.</p>";
    return;
  }

  list.innerHTML = "";
  quizzes.forEach((q, index) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${q.title}</h3>
      <p>${q.topic} • ${q.questions.length} perguntas</p>
    `;

    // botão para jogar
    const playBtn = document.createElement("button");
    playBtn.textContent = "▶️ Jogar";
    playBtn.onclick = () => {
      quiz = q;
      savedSection.classList.add("hidden");
      renderQuiz();
      step3.classList.remove("hidden");
    };

    // botão para apagar
    const delBtn = document.createElement("button");
    delBtn.textContent = "🗑️ Apagar";
    delBtn.style.background = "#ef4444";
    delBtn.onclick = () => {
      if (confirm(`Apagar o quiz "${q.title}"?`)) {
        quizzes.splice(index, 1);
        localStorage.setItem("saved_quizzes", JSON.stringify(quizzes));
        renderSaved();
        showToast("Quiz apagado!");
      }
    };

    card.appendChild(playBtn);
    card.appendChild(delBtn);
    list.appendChild(card);
  });

  // botão para apagar tudo
  const clearAll = document.createElement("button");
  clearAll.textContent = "❌ Apagar todos os quizzes";
  clearAll.style.background = "#b91c1c";
  clearAll.style.marginTop = "10px";
  clearAll.onclick = () => {
    if (confirm("Tens a certeza que queres apagar todos os quizzes?")) {
      localStorage.removeItem("saved_quizzes");
      renderSaved();
      showToast("Todos os quizzes foram apagados!");
    }
  };
  list.appendChild(clearAll);
}
