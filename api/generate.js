export default async function handler(req, res) {
  const { topic = "História", type = "mc", n = 5 } = req.query;

  const prompt = `
Gera um JSON ESTRITO em português de Portugal com o seguinte formato:
{
  "questions": [
    ${
      type === "mc"
        ? '{"type":"mc","prompt":"texto","options":["A","B","C"],"answer":0}'
        : '{"type":"fill","prompt":"frase com ___","answer":"resposta"}'
    }
  ]
}
Regras:
- Tema: ${topic}
- ${n} perguntas (entre 3 e 10)
- Português de Portugal
- Não escrevas nada fora do JSON
`;

  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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

    const data = await r.json();
    const raw = data?.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const cleaned = raw.replace(/\\"/g, '"').replace(/[\u0000-\u001F]/g, "");
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    // Normalizar campos PT/EN
    if (parsed) {
      const perguntas =
        parsed.perguntas || parsed.questoes || parsed["questões"] || [];
      const questions = parsed.questions || [];
      parsed.questions =
        perguntas.length > questions.length ? perguntas : questions;
    }

    if (!Array.isArray(parsed?.questions))
      throw new Error("Resposta inválida da IA");

    parsed.questions = parsed.questions.map((q) => ({
      type: q.type || q.tipo || "mc",
      prompt: q.prompt || q.pergunta || q.enunciado || "",
      options: q.options || q.opcoes || q.opções || [],
      answer: q.answer ?? q.resposta ?? 0,
    }));

    res.status(200).json(parsed);
  } catch (err) {
    res.status(500).json({
      error: "Resposta inválida da IA",
      raw: err.message,
    });
  }
}
