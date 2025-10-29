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
    // 🔹 Pollinations API (sem chave)
    const response = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const text = await response.text();
    console.log("Resposta da IA:", text);

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
    output.textContent =
      "⚠️ Erro ao gerar perguntas. O servidor Pollinations pode estar offline.\n\n" +
      err.message +
      "\n\n💡 Tenta de novo ou usa o modo manual.";
  }
});
