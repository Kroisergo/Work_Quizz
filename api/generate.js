export default async function handler(req, res) {
  const { topic, n = 5, type = "mc", withImages = false } = req.query;

  try {
    // PROMPT enviado para Pollinations
    const prompt = `
Gera um JSON ESTRITO em português de Portugal com este formato:
{
  "questions": [
    ${type === "mc"
      ? '{"type":"mc","prompt":"texto","options":["A","B","C"],"answer":0,"image": null}'
      : '{"type":"fill","prompt":"frase com ___","options":[],"answer":"resposta","image": null}'
    }
  ]
}
Regras:
- Tema: ${topic}
- Número de perguntas: ${n} (entre 3 e 10)
- Tipo: ${type === "mc" ? "múltipla escolha" : "preencher espaço (usa ___ no enunciado)"}
- Português de Portugal
- Não escrevas nada fora do JSON.
- ${withImages ? 'A propriedade "image" pode ser null ou URL.' : 'A propriedade "image" deve ser null.'}
`;

    // Chamada à API Pollinations em tempo real
    const response = await fetch("https://text.pollinations.ai/openai/gpt-4o-mini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }] }),
    });

    const text = await response.text();

    // Tentar extrair JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) data = JSON.parse(match[0]);
    }

    if (!data || !Array.isArray(data.questions)) {
      return res.status(500).json({ error: "Resposta inválida da IA", raw: text });
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error("Erro ao gerar perguntas:", err);
    res.status(500).json({ error: "Falha ao gerar perguntas", details: err.message });
  }
}
