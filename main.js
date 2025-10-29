let quiz = { title: "", topic: "", type: "mc", n: 5, questions: [] };

const step1 = document.querySelector("#step1");
const step2 = document.querySelector("#step2");
const step3 = document.querySelector("#step3");
const output = document.querySelector("#output");

document.querySelector("#next1").onclick = () => {
  quiz.title = document.querySelector("#title").value.trim() || "Quiz";
  quiz.topic = document.querySelector("#topic").value.trim();
  quiz.type = document.querySelector("#type").value;
  quiz.n = parseInt(document.querySelector("#num").value);
  if (!quiz.topic) return alert("Indica um tema!");
  step1.classList.add("hidden");
  step2.classList.remove("hidden");
};

document.querySelector("#generate").onclick = async () => {
  output.textContent = "⏳ A gerar perguntas em tempo real...";
  try {
    const res = await fetch(
      `/api/generate?topic=${encodeURIComponent(quiz.topic)}&type=${quiz.type}&n=${quiz.n}`
    );
    const data = await res.json();
    if (!Array.isArray(data.questions))
      throw new Error("Resposta inválida da IA");
    quiz.questions = data.questions;
    output.textContent = JSON.stringify(quiz.questions, null, 2);
  } catch (err) {
    output.innerHTML = `
⚠️ <strong>Erro ao gerar perguntas.</strong><br><br>
${err.message}<br><br>
💡 Verifica se a API Key do OpenRouter está correta.
`;
  }
};

document.querySelector("#next2").onclick = () => {
  if (quiz.questions.length === 0) return alert("Ainda não há perguntas!");
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

document.querySelector("#finish").onclick = () => {
  const quizzes = JSON.parse(localStorage.getItem("saved_quizzes") || "[]");
  quizzes.push(quiz);
  localStorage.setItem("saved_quizzes", JSON.stringify(quizzes));
  alert("Quiz guardado!");
  location.reload();
};
