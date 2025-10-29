// ===============================
// Função principal para gerar perguntas com IA
// ===============================
async function gerarPerguntas() {
  const quizContainer = document.getElementById("quiz");
  quizContainer.innerHTML = "<p>A gerar perguntas... ⏳</p>";

  try {
    // Faz a chamada ao endpoint do Vercel (usa a tua API Key guardada no ambiente)
    const resposta = await fetch("/api/generate");

    if (!resposta.ok) {
      throw new Error("Falha na resposta da API");
    }

    const dados = await resposta.json();
    console.log("Dados recebidos:", dados);

    // A estrutura depende do que o backend devolve.
    // Vamos assumir que o modelo devolve um array de perguntas em formato JSON.
    const texto = dados.choices?.[0]?.message?.content;
    let perguntas = [];

    try {
      perguntas = JSON.parse(texto);
    } catch {
      // Se o modelo devolver texto puro, faz parse manual
      perguntas = [
        {
          pergunta: "Quem foi o primeiro rei de Portugal?",
          opcoes: ["Afonso I", "Sancho I", "D. Pedro I", "João II"],
          resposta: 0
        }
      ];
    }

    // Renderiza as perguntas
    quizContainer.innerHTML = "";
    perguntas.forEach((q, i) => {
      const div = document.createElement("div");
      div.classList.add("pergunta");

      const titulo = document.createElement("h3");
      titulo.textContent = `${i + 1}. ${q.pergunta}`;
      div.appendChild(titulo);

      q.opcoes.forEach((opcao, idx) => {
        const btn = document.createElement("button");
        btn.textContent = opcao;
        btn.onclick = () => {
          if (idx === q.resposta) {
            btn.style.backgroundColor = "green";
          } else {
            btn.style.backgroundColor = "red";
          }
        };
        div.appendChild(btn);
      });

      quizContainer.appendChild(div);
    });
  } catch (erro) {
    console.error("Erro ao gerar perguntas:", erro);
    quizContainer.innerHTML =
      "<p>⚠️ Erro ao gerar perguntas. Verifica a tua API Key no Vercel.</p>";
  }
}

// ===============================
// Liga o botão “Gerar Perguntas” à função
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const botao = document.getElementById("btnGerar");
  if (botao) {
    botao.addEventListener("click", gerarPerguntas);
  }
});
