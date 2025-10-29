export default async function handler(req, res) {
  const { topic, n, type, withImages } = req.query;

  const prompt = `
Gera um JSON ESTRITO em português de Portugal:
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
- Número de perguntas: ${n}
- Tipo: ${type === "mc" ? "múltipla escolha" : "preencher espaço"}
- Português de Portugal (ortografia PT-PT)
- Em múltipla escolha, devolve 3–4 opções e "answer" é o índice correto (0-based)
- ${withImages === "true"
    ? "Inclui URL de imagem ilustrativa educativa simples em 'image'."
    : "A propriedade 'image' deve ser null."
  }
- Não escrevas nada fora do JSON.
  `;

  const url = "https://text.pollinations.ai/" + encodeURIComponent(prompt) +
              "?model=llama3.1:70b&temperature=0.3&top_p=0.9";

  try {
    const r = await fetch(url);
    const txt = await r.text();
    res.status(200).send(txt);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
