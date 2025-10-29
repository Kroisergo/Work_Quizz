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
    // 1️⃣ Primeiro tenta Pollinations
    const pollRes = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    let text = await pollRes.text();

    // 2️⃣ Se a Pollinations falhar, usa Hugging Face
    if (!text || text.length < 50 || !text.includes("{")) {
      console.warn("⚠️ Pollinations falhou, a usar Hugging Face…");
      const hfRes = await fetch(
        "https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inputs: prompt }),
        }
      );
      const hfData = await hfRes.json();
      text = hfData[0]?.generated_text || "";
    }

    console.log("🧠 Resposta IA:", text);

    // 3️⃣ Extrai JSON da resposta
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) data = JSON.parse(match[0]);
    }

    if (!data || !Array.isArray(data.questions)) {
      throw new Error("Resposta inválida da IA");
    }

    output.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    console.error(err);
    output.innerHTML = `
⚠️ <strong>Erro ao gerar perguntas.</strong><br>
O servidor de IA pode estar offline.<br><br>
${err.message}<br><br>
💡 Tenta de novo ou usa o modo manual.
`;
  }
});
