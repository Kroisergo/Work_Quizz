export default async function handler(req, res) {
  const { topic, type } = req.query;

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
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "mistralai/mixtral-8x7b-instruct",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const text =
      data?.choices?.[0]?.message?.content ||
      data?.output ||
      JSON.stringify(data);

    // Limpar caracteres e quebras de linha
    const cleaned = text
      .replace(/\\n/g, " ")
      .replace(/\s+/g, " ")
      .replace(/“|”/g, '"')
      .trim();

    // Tentar extrair JSON válido
    let parsed = null;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          parsed = null;
        }
      }
    }

    // Normalizar chaves em PT/EN
    if (parsed) {
      parsed.questions =
        parsed.questions ||
        parsed.questoes ||
        parsed["questões"] ||
        parsed.perguntas ||
        [];
    }

    if (Array.isArray(parsed?.questions)) {
      parsed.questions = parsed.questions.map((q) => ({
        type: q.type || q.tipo || "mc",
        prompt: q.prompt || q.pergunta || "",
        options: q.options || q.opcoes || q.opções || [],
        answer: q.answer ?? q.resposta ?? 0,
      }));
    }

    // Verificar se tem perguntas válidas
    if (!parsed || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      return res.status(500).json({
        error: "Resposta inválida da IA",
        raw: cleaned.slice(0, 500),
      });
    }

    // Enviar resposta limpa
    res.status(200).json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

