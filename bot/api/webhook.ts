import type { VercelRequest, VercelResponse } from "@vercel/node";
import { enviarMensaje, descargarArchivo, type TelegramUpdate } from "../lib/telegram.js";
import { transcribirAudio } from "../lib/groq.js";
import { parsearMovimiento } from "../lib/parse.js";
import {
  getConversacionPendiente,
  guardarConversacionPendiente,
  borrarConversacionPendiente,
  insertMovimiento,
  type BorradorMovimiento,
} from "../lib/db.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }

  const update = req.body as TelegramUpdate;
  const mensaje = update.message;

  if (!mensaje || (!mensaje.text && !mensaje.voice)) {
    res.status(200).send("ok"); // Ignorar updates que no son mensajes de texto/voz
    return;
  }

  const chatId = mensaje.chat.id;

  try {
    let texto: string;
    let fuente: "telegram_texto" | "telegram_audio";

    if (mensaje.voice) {
      const { buffer, mimeType } = await descargarArchivo(mensaje.voice.file_id);
      texto = await transcribirAudio(buffer, mimeType);
      fuente = "telegram_audio";
    } else {
      texto = mensaje.text!;
      fuente = "telegram_texto";
    }

    const pendiente = await getConversacionPendiente(String(chatId));
    const borradorPrevio: BorradorMovimiento = pendiente?.borrador ?? {};
    if (!borradorPrevio.fuente) borradorPrevio.fuente = fuente;

    const resultado = await parsearMovimiento(texto, borradorPrevio);

    if (resultado.completo) {
      const b = resultado.borrador;
      const guardado = await insertMovimiento({
        fecha: new Date().toISOString(),
        tipo: b.tipo!,
        cuenta: b.cuenta!,
        categoria: b.categoria!,
        subcategoria: b.subcategoria ?? null,
        monto: b.monto!,
        descripcion: b.descripcion!,
        fuente: b.fuente ?? fuente,
      });
      await borrarConversacionPendiente(String(chatId));

      const signo = b.tipo === "ingreso" ? "+" : "-";
      await enviarMensaje(
        chatId,
        `✅ Anoté un ${b.tipo} de ${signo}$${b.monto} en ${b.categoria}${b.subcategoria ? ` (${b.subcategoria})` : ""} — ${b.cuenta}.\n"${b.descripcion}"`
      );
    } else {
      await guardarConversacionPendiente(String(chatId), resultado.borrador, resultado.preguntaSiguiente!);
      await enviarMensaje(chatId, resultado.preguntaSiguiente!);
    }

    res.status(200).send("ok");
  } catch (err) {
    console.error(err);
    await enviarMensaje(chatId, "⚠️ Tuve un problema para procesar ese mensaje. ¿Podés intentar de nuevo?").catch(() => {});
    res.status(200).send("ok"); // Responder 200 siempre para que Telegram no reintente en loop
  }
}
