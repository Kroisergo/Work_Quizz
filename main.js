// ---------- VARIÁVEIS E ESTADO ----------
let quiz = { title: "", topic: "", type: "mc", n: 5, questions: [] };

// ---------- ELEMENTOS ----------
const step1 = document.querySelector("#step1");
const step2 = document.querySelector("#step2");
const step3 = document.querySelector("#step3");
const savedSection = document.querySelector("#savedSection");
const output = document.querySelector("#output");
const toast = document.querySelector("#toast");

// ---------- TEMA ----------
document.querySelector("#themeBtn").onclick = () => {
  document.documentElement.classList.toggle("light");
  localStorage.setItem("theme", document.documentElement.classList.contains("light") ? "light" : "dark");
};

if (localStorage.getItem("theme") === "light")
  document.documentElement.classList.add("light");

// ---------- NAVEGAÇÃO ----------
document.querySelector("#homeBtn").onclick = () => {
  step1.classList.remove("hidden");
  step2.classList.add("hidden");
  step3.classList.add("hidden");
  savedSection.classList.add("hidden");
};

document.querySelector("#savedBtn").onclick = () => {
  step1.classList.add("hidden");
  step2.classList.add("hidden");
  step3.classList.add("hidden");
  savedSection.classList.remove("hidden");
  renderSaved();
};

document.querySelector("#backHome").onclick = () => {
  savedSection.classList.add("hidden");
  step1.classList.remove("hidden");
};

// ---------- TOAST ----------
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.remove("hidden");
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

// ---------- ETAPA 1 ----------
document.querySelector("#next1").onclick = () => {
  const title = document.querySelector("#title").value.trim();
  const topic = document.querySelector("#topic").value.trim();
  const type = document.querySelector("#type").value;
  const n = parseInt(document.querySelector("#num").value);

  if (!topic) return showToast("⚠️ Indica um tema!");

  quiz = { title: title || "Quiz", topic, type, n, questions: [] };

  step1.classList.add("hidden");
  step2.classList.remove("hidden");
  output.textContent = "Ainda sem perguntas...";
};

// ---------- GERAR PERGUNTAS COM IA ----------
async function generateQuestions() {
  const topic = quiz.topic;
  const n = quiz.n;
  const type = quiz.type;

  output.textContent = "⏳ A gerar perguntas com IA...";

  const prompt = `
Gera um JSON ESTRITO em português de Portugal:
{
  "questions": [
    ${type === "mc"
      ? '{"type":"mc","prompt":"texto","options":["A","B","C"],"answer":0}'
      : '{"type":"fill","prompt":"frase com ___","answer":"resposta"}'}
  ]
}
Regras:
- Tema: ${topic}
- ${n} perguntas
- Português de Portugal
- Não escrevas nada fora do JSON.
`;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_KEY}`,
      },
      body: JSON.stringify({
        model: "mistralai/mixtral-8x7b-instruct",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await res.json();
    const text =
      data?.choices?.[0]?.message?.content ||
      data?.output ||
      JSON.stringify(data);

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    if (!parsed || !Array.isArray(parsed.questions))
      throw new Error("Resposta inválida: " + text.slice(0, 200));

    quiz.questions = parsed.questions;
    output.textContent = JSON.stringify(quiz.questions, null, 2);
    showToast("✅ Perguntas geradas!");
  } catch (err) {
    console.error("Erro:", err);
    output.innerHTML = `⚠️ Erro ao gerar perguntas.<br>${err.message}`;
  }
}

// ---------- BOTÕES GERAR ----------
document.querySelector("#generate").onclick = generateQuestions;
document.querySelector("#regenerate").onclick = generateQuestions;

// ---------- ADICIONAR MANUALMENTE ----------
const manualArea = document.querySelector("#manualArea");
const manualForm = document.querySelector("#manualForm");
const saveManualBtn = document.querySelector("#saveManual");

document.querySelector("#manual").onclick = () => {
  manualArea.classList.toggle("hidden");
  if (!manualArea.classList.contains("hidden")) renderManualForm();
};

function renderManualForm() {
  manualForm.innerHTML = "";

  const promptField = document.createElement("div");
  promptField.className = "manual-field";
  promptField.innerHTML = `
    <label>Pergunta</label>
    <input type="text" id="manualPrompt" placeholder="Escreve o enunciado da pergunta">
  `;
  manualForm.appendChild(promptField);

  if (quiz.type === "mc") {
    const choicesWrap = document.createElement("div");
    choicesWrap.className = "manual-field";
    choicesWrap.innerHTML = `<label>Opções</label>`;
    const choicesList = document.createElement("div");
    choicesWrap.appendChild(choicesList);

    function addChoice(value = "") {
      const row = document.createElement("div");
      row.className = "choice-row";
      row.innerHTML = `
        <input type="text" value="${value}" placeholder="Opção..." />
        <input type="radio" name="manualAnswer" />
      `;
      choicesList.appendChild(row);
    }

    for (let i = 0; i < 3; i++) addChoice();

    const addBtn = document.createElement("button");
    addBtn.textContent = "+ Adicionar opção";
    addBtn.className = "add-choice";
    addBtn.onclick = (e) => {
      e.preventDefault();
      if (choicesList.children.length < 4) addChoice();
      else showToast("Máximo 4 opções.");
    };
    choicesWrap.appendChild(addBtn);
    manualForm.appendChild(choicesWrap);
  } else {
    const ansField = document.createElement("div");
    ansField.className = "manual-field";
    ansField.innerHTML = `
      <label>Resposta correta</label>
      <input type="text" id="manualAnswer" placeholder="Resposta correta">
    `;
    manualForm.appendChild(ansField);
  }
}

// Guardar a pergunta manualmente
saveManualBtn.onclick = () => {
  const promptValue = document.querySelector("#manualPrompt")?.value.trim();
  if (!promptValue) return showToast("Escreve a pergunta primeiro!");

  if (quiz.type === "mc") {
    const rows = manualForm.querySelectorAll(".choice-row");
    const opts = [];
    let correctIndex = 0;
    rows.forEach((r, i) => {
      const txt = r.querySelector('input[type="text"]').value.trim();
      const checked = r.querySelector('input[type="radio"]').checked;
      if (txt) opts.push(txt);
      if (checked) correctIndex = i;
    });
    if (opts.length < 2) return showToast("Pelo menos 2 opções!");
    const q = { type: "mc", prompt: promptValue, options: opts, answer: correctIndex };
    quiz.questions.push(q);
  } else {
    const ans = document.querySelector("#manualAnswer")?.value.trim() || "";
    const q = { type: "fill", prompt: promptValue, answer: ans };
    quiz.questions.push(q);
  }

  manualArea.classList.add("hidden");
  output.textContent = JSON.stringify(quiz.questions, null, 2);
  showToast("Pergunta adicionada com sucesso!");
};

// ---------- ETAPA 2 → REVISÃO ----------
document.querySelector("#next2").onclick = () => {
  if (quiz.questions.length === 0)
    return showToast("Ainda não tens perguntas!");
  step2.classList.add("hidden");
  step3.classList.remove("hidden");
  renderQuiz();
};

// ---------- JOGAR QUIZ ----------
function renderQuiz() {
  const playArea = document.querySelector("#playArea");
  playArea.innerHTML = "";

  let score = 0;

  quiz.questions.forEach((q, i) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<h3>${i + 1}. ${q.prompt}</h3>`;

    if (q.type === "mc") {
      q.options.forEach((opt, idx) => {
        const btn = document.createElement("button");
        btn.textContent = opt;
        btn.onclick = () => {
          if (btn.disabled) return;
          if (idx === q.answer) {
            btn.style.borderColor = "lime";
            btn.style.color = "lime";
            score++;
          } else {
            btn.style.borderColor = "red";
            btn.style.color = "red";
          }
          Array.from(btn.parentNode.children).forEach(b => b.disabled = true);
        };
        card.appendChild(btn);
      });
    } else {
      const inp = document.createElement("input");
      inp.placeholder = "Resposta…";
      const check = document.createElement("button");
      check.textContent = "Validar";
      check.onclick = () => {
        if (inp.disabled) return;
        const ok =
          inp.value.trim().toLowerCase() === q.answer.trim().toLowerCase();
        if (ok) {
          inp.style.borderColor = "lime";
          score++;
        } else inp.style.borderColor = "red";
        inp.disabled = true;
        check.disabled = true;
      };
      card.appendChild(inp);
      card.appendChild(check);
    }

    playArea.appendChild(card);
  });

  const finish = document.createElement("button");
  finish.textContent = "🏁 Finalizar Quiz";
  finish.onclick = () => {
    alert(`Pontuação: ${score}/${quiz.questions.length}`);
  };
  playArea.appendChild(finish);
}

// ---------- CONCLUIR & GUARDAR ----------
document.querySelector("#finish").onclick = () => {
  const saved = JSON.parse(localStorage.getItem("saved_quizzes") || "[]");
  quiz.createdAt = new Date().toISOString();
  saved.unshift(quiz);
  localStorage.setItem("saved_quizzes", JSON.stringify(saved));
  showToast("Quiz guardado!");
  step3.classList.add("hidden");
  step1.classList.remove("hidden");
};

// ---------- RENDERIZAR GUARDADOS ----------
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

    const playBtn = document.createElement("button");
    playBtn.textContent = "▶️ Jogar";
    playBtn.onclick = () => {
      quiz = q;
      savedSection.classList.add("hidden");
      step3.classList.remove("hidden");
      renderQuiz();
    };

    const delBtn = document.createElement("button");
    delBtn.textContent = "❌ Apagar";
    delBtn.className = "warn";
    delBtn.onclick = () => {
      if (confirm(`Apagar o quiz "${q.title}"?`)) {
        quizzes.splice(index, 1);
        localStorage.setItem("saved_quizzes", JSON.stringify(quizzes));
        renderSaved();
        showToast("Quiz apagado!");
      }
    };

    const group = document.createElement("div");
    group.className = "btn-group";
    group.appendChild(playBtn);
    group.appendChild(delBtn);

    card.appendChild(group);
    list.appendChild(card);
  });
}

// ---------- APAGAR TODOS ----------
document.querySelector("#clearAll").onclick = () => {
  if (confirm("Tens a certeza que queres apagar todos os quizzes guardados?")) {
    localStorage.removeItem("saved_quizzes");
    renderSaved();
    showToast("Todos os quizzes foram apagados!");
  }
};
