function token() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    throw new Error("Falta la variable de entorno TELEGRAM_BOT_TOKEN");
  }
  return process.env.TELEGRAM_BOT_TOKEN;
}

const API = () => `https://api.telegram.org/bot${token()}`;
const FILE_API = () => `https://api.telegram.org/file/bot${token()}`;

export async function enviarMensaje(chatId: number | string, texto: string) {
  await fetch(`${API()}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: texto }),
  });
}

export async function descargarArchivo(fileId: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const infoResp = await fetch(`${API()}/getFile?file_id=${fileId}`);
  const info = await infoResp.json();
  const filePath: string = info.result.file_path;
  const fileResp = await fetch(`${FILE_API()}/${filePath}`);
  const arrayBuffer = await fileResp.arrayBuffer();
  const mimeType = filePath.endsWith(".oga") || filePath.endsWith(".ogg") ? "audio/ogg" : "audio/mpeg";
  return { buffer: Buffer.from(arrayBuffer), mimeType };
}

export interface TelegramUpdate {
  message?: {
    chat: { id: number };
    text?: string;
    voice?: { file_id: string };
  };
}
