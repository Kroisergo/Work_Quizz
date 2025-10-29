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
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer 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", // ⚠️ mete aqui a tua chave
      },
      body: JSON.stringify({
        model: "mistralai/mixtral-8x7b-instruct", // modelo gratuito e rápido
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await res.json();
    console.log("Resposta OpenRouter:", data);

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

    if (!parsed || !Array.isArray(parsed.questions)) {
      throw new Error("Resposta inválida: " + text.slice(0, 200));
    }

    output.textContent = JSON.stringify(parsed, null, 2);
  } catch (err) {
    console.error("Erro:", err);
    output.innerHTML = `
⚠️ <strong>Erro ao gerar perguntas.</strong><br><br>
${err.message}<br><br>
💡 Confirma se a tua API Key do OpenRouter está correta.<br>
Podes criar uma gratuita em <a href="https://openrouter.ai/keys" target="_blank">openrouter.ai/keys</a>.
`;
  }
});