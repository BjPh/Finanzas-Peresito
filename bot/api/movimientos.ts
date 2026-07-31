import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getMovimientos } from "../lib/db.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).send("Method not allowed");
    return;
  }

  const mes = typeof req.query.mes === "string" ? req.query.mes : undefined;
  const cuenta = typeof req.query.cuenta === "string" ? req.query.cuenta : undefined;
  const categoria = typeof req.query.categoria === "string" ? req.query.categoria : undefined;

  try {
    const movimientos = await getMovimientos({ mes, cuenta, categoria });
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json({ movimientos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "No se pudieron obtener los movimientos" });
  }
}
