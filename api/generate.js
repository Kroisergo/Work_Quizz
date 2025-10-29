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
    const rawText =
      data?.choices?.[0]?.message?.content ||
      data?.output ||
      JSON.stringify(data);

    // 1️⃣ Limpar sequências \n, aspas e espaços
    let cleaned = rawText
      .replace(/\\n/g, " ")
      .replace(/\n/g, " ")
      .replace(/\r/g, "")
      .replace(/“|”/g, '"')
      .replace(/‘|’/g, "'")
      .replace(/\s+/g, " ")
      .trim();

    // 2️⃣ Se vier com aspas duplas escapadas (\"), tenta limpar
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }
    cleaned = cleaned.replace(/\\"/g, '"').replace(/\\\\/g, "\\");

    // 3️⃣ Tentar extrair JSON válido
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

    // 4️⃣ Normalizar campos PT-PT
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
        prompt: q.prompt || q.pergunta || q.enunciado || "",
        options: q.options || q.opcoes || q.opções || [],
        answer: q.answer ?? q.resposta ?? 0,
      }));
    }

    // 5️⃣ Validar resultado
    if (!parsed || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      return res.status(500).json({
        error: "Resposta inválida da IA",
        raw: cleaned.slice(0, 700),
      });
    }

    // 6️⃣ Enviar resposta final
    res.status(200).json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
