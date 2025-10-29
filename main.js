document.querySelector("#generate").addEventListener("click", async () => {
  const topic = document.querySelector("#topic").value.trim();
  const type = document.querySelector("#type").value;
  const output = document.querySelector("#output");
  output.textContent = "⏳ A gerar perguntas em tempo real...";

  const prompt = `
Gera um JSON ESTRITO em português de Portugal com este formato:
{
  "questions": [
    ${type === "mc"
      ? '{"type":"mc","prompt":"texto","options":["A","B","C"],"answer":0}'
      : '{"type":"fill","prompt":"frase com ___","answer":"resposta"}'}
  ]
}
Regras:
- Tema: ${topic}
- 5 perguntas
- Português de Portugal
- Não escrevas nada fora do JSON.
`;

  try {
    let text = "";

    // 🚀 Pollinations primeiro
    try {
      const res = await fetch("https://text.pollinations.ai/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai",
          messages: [{ role: "user", content: prompt }],
        }),
      });
      text = await res.text();
    } catch (err) {
      console.warn("⚠️ Pollinations falhou:", err.message);
    }

    // 🔁 Fallback Hugging Face se Pollinations não respondeu
    if (!text || text.length < 30 || !text.includes("{")) {
      console.warn("⚙️ A usar Hugging Face como fallback...");
      const hfRes = await fetch(
        "https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inputs: prompt }),
        }
      );
      const hfData = await hfRes.json();
      text =
        hfData?.[0]?.generated_text ||
        hfData?.generated_text ||
        JSON.stringify(hfData);
    }

    // 🔍 Mostra na página o texto cru recebido
    output.textContent =
      "🧠 Resposta recebida da IA:\n\n" + text + "\n\nA tentar converter para JSON...";

    // 🧩 Extrair JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) data = JSON.parse(match[0]);
    }

    if (!data || !Array.isArray(data.questions)) {
      throw new Error("❌ Ainda não é JSON válido (sem campo questions).");
    }

    output.textContent =
      "✅ Perguntas geradas com sucesso:\n\n" +
      JSON.stringify(data, null, 2);
  } catch (err) {
    console.error("Erro final:", err);
    output.innerHTML = `
⚠️ <strong>Erro ao gerar perguntas.</strong><br><br>
${err.message}<br><br>
🧩 Isto ajuda: verifica no texto acima se veio algum JSON parcial.<br><br>
💡 Copia o conteúdo e mostra-me aqui.
`;
  }
});
