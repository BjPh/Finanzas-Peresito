export async function transcribirAudio(buffer: Buffer, mimeType: string): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("Falta la variable de entorno GROQ_API_KEY");
  }

  const form = new FormData();
  const ext = mimeType.includes("ogg") ? "ogg" : "mp3";
  form.append("file", new Blob([buffer], { type: mimeType }), `audio.${ext}`);
  form.append("model", "whisper-large-v3");
  form.append("language", "es");
  form.append("response_format", "text");

  const resp = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: form,
  });

  if (!resp.ok) {
    const detalle = await resp.text();
    throw new Error(`Groq falló al transcribir (${resp.status}): ${detalle}`);
  }

  const texto = await resp.text();
  return texto.trim();
}
