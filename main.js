document.querySelector("#generate").addEventListener("click", async () => {
  const topic = document.querySelector("#topic").value.trim();
  const type = document.querySelector("#type").value;
  const output = document.querySelector("#output");
  output.textContent = "⏳ A gerar perguntas em tempo real...";

  try {
    const res = await fetch(
      `/api/generate?topic=${encodeURIComponent(topic)}&type=${type}`
    );
    const data = await res.json();

    if (data.error) {
      throw new Error(
        "Resposta inválida: " + JSON.stringify(data, null, 2)
      );
    }

    output.textContent = JSON.stringify(data, null, 2);
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
