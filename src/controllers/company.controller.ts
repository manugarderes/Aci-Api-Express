import { Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import type { Company } from "../models/Company.js";

export const getMine = async (req: Request, res: Response) => {
  const { company_id } = (req as any).user;

  const { data: company, error } = await supabase
    .from("companies")
    .select("id, name")
    .eq("id", company_id)
    .single<Pick<Company, "id" | "name">>();

  if (error || !company) {
    return res.status(404).json({ error: "No encontrado" });
  }

  return res.json(company);
};

export const getMetrics = async (req: Request, res: Response) => {
  try {
    // Así es como traés el companyId del usuario autenticado según tu middleware [cite: 158, 710]
    const { company_id } = (req as any).user;

    // 1. Obtener tickets filtrando por la relación con el cliente (que sí tiene company_id) [cite: 926, 944]
    // Usamos el filtrado de Supabase en tablas relacionadas
    const { data: tickets, error: tError } = await supabase
      .from("tickets")
      .select(
        `
        total, paid, due_date, payment_url,
        clients!inner(company_id)
      `
      )
      .eq("clients.company_id", company_id);

    if (tError) throw tError;

    // 2. Obtener mensajes vinculados a los tickets de los clientes de esta empresa [cite: 901, 904]
    const { data: messages, error: mError } = await supabase
      .from("messages")
      .select(
        `
        type,
        tickets!inner(
          clients!inner(company_id)
        )
      `
      )
      .eq("tickets.clients.company_id", company_id);

    if (mError) throw mError;

    // --- CÁLCULOS (Lógica de negocio de ACI) ---

    // Monto Total en Gestión (Pendientes) [cite: 174, 180]
    const totalEnGestion = tickets
      .filter((t) => !t.paid)
      .reduce((sum, t) => sum + Number(t.total), 0);

    // Monto Total Cobrado [cite: 301]
    const totalCobrado = tickets
      .filter((t) => t.paid)
      .reduce((sum, t) => sum + Number(t.total), 0);

    // Tasa de Recuperación [%] [cite: 258]
    const tasaRecuperacion =
      tickets.length > 0
        ? (tickets.filter((t) => t.paid).length / tickets.length) * 100
        : 0;

    // Tickets para revisar (con comprobante pero no marcados como pagados) [cite: 211, 754]
    const ticketsParaRevisar = tickets.filter(
      (t) => t.payment_url && !t.paid
    ).length;

    // Días de mora promedio (DSO) [cite: 258, 301]
    const hoy = new Date();
    const ticketsVencidos = tickets.filter(
      (t) => !t.paid && new Date(t.due_date) < hoy
    );

    const diasMoraPromedio =
      ticketsVencidos.length > 0
        ? ticketsVencidos.reduce((sum, t) => {
            const diferenciaBus =
              hoy.getTime() - new Date(t.due_date).getTime();
            return sum + Math.floor(diferenciaBus / (1000 * 60 * 60 * 24));
          }, 0) / ticketsVencidos.length
        : 0;

    // Volumen de mensajes por canal (WhatsApp/Email) [cite: 54, 189]
    const volumenMensajes = {
      whatsapp: messages.filter((m) => m.type === "WSP").length,
      email: messages.filter((m) => m.type === "MAIL").length,
    };

    return res.status(200).json({
      totalEnGestion,
      totalCobrado,
      tasaRecuperacion: Number(tasaRecuperacion.toFixed(2)),
      diasMoraPromedio: Math.round(diasMoraPromedio),
      ticketsParaRevisar,
      volumenMensajes,
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: "Error al obtener métricas: " + error.message });
  }
};
