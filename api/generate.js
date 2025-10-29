export default async function handler(req, res) {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Gera perguntas de cultura geral em português de Portugal, com 4 opções e 1 resposta correta (índice da opção correta)."
        },
        { role: "user", content: "Cria 5 perguntas de escolha múltipla." }
      ],
    }),
  });

  const data = await response.json();
  return res.status(200).json(data);
}
