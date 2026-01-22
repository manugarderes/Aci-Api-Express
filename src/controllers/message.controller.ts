import { Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import { generateAIContent } from "../utils/generateAi.js";
import { sendWabaTemplate } from "../utils/snedWaba.js";
import { sendEmail } from "../utils/sendEmail.js";

export const getAll = async (req: Request, res: Response) => {
  const { company_id } = (req as any).user;

  const { data: messages, error } = await supabase
    .from("messages")
    .select(
      `
      *,
      ticket:tickets!inner (
        *,
        client:clients!inner (*)
      )
    `,
    )
    .eq("ticket.client.company_id", company_id);

  if (error) return res.status(500).json({ error: error.message });

  return res.json(messages);
};

export const getById = async (req: Request, res: Response) => {
  const { company_id } = (req as any).user;
  const id = Number(req.params.id);

  const { data: message, error } = await supabase
    .from("messages")
    .select(
      `
      *,
      ticket:tickets!inner (
        *,
        client:clients!inner (*)
      )
    `,
    )
    .eq("id", id)
    .eq("ticket.client.company_id", company_id)
    .single();

  if (error || !message)
    return res.status(404).json({ error: "No encontrado" });

  return res.json(message);
};

// ------------------------------------------------------------------
// Proceso Automático (CRON)
// ------------------------------------------------------------------

export const processAutomatedReminders = async (req: any, res: any) => {
  console.log("⏰ CRON activado");

  try {
    const { data: companies, error: compError } = await supabase
      .from("companies")
      .select("id, name");

    if (compError) throw compError;

    let totalMensajesEnviados = 0;

    for (const company of companies) {
      const { data: reminders } = await supabase
        .from("reminders")
        .select("*")
        .eq("company_id", company.id);

      const { data: allTickets } = await supabase
        .from("tickets")
        .select(
          `
          *,
          client:clients!inner (
            id, name, email, phone, company_id,
            company:companies ( name )
          )
        `,
        )
        .eq("client.company_id", company.id)
        .eq("paid", false);

      if (!reminders || !allTickets) continue;

      const tickets = allTickets.filter(
        (ticket) =>
          !ticket.payment_url || ticket.payment_url.trim().length <= 5,
      );

      const today = new Date();

      for (const reminder of reminders) {
        for (const ticket of tickets) {
          const dueDate = new Date(ticket.due_date);
          const diffTime = today.getTime() - dueDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === reminder.days_from_due) {
            const { data: existingMessage } = await supabase
              .from("messages")
              .select("id")
              .eq("ticket_id", ticket.id)
              .eq("reminder_id", reminder.id);

            if (!existingMessage || existingMessage.length == 0) {
              console.log("✅ Igualdad de recordatorio y ticket encontrada");

              let contentToSave = "";

              if (reminder.channel === "whatsapp") {
                // 1. Envío por WhatsApp: Retorna el texto exacto de la plantilla aprobada
                contentToSave = await sendWabaTemplate(
                  ticket.client.phone,
                  ticket.client.name,
                  company.name,
                  ticket.currency,
                  ticket.total,
                  ticket.due_date,
                );
                console.log("💬 Plantilla enviada por WSP: ", contentToSave);
              } else {
                // 2. Envío por Email: Generación de contenido con IA y envío vía SendGrid
                contentToSave = await generateAIContent(ticket, reminder);

                console.log("🧠 Texto generado por IA: ", contentToSave);

                await sendEmail({
                  to: ticket.client.email,
                  subject: `Recordatorio de Pago - ${company.name}`,
                  html: `<p>${contentToSave.replace(/\n/g, "<br>")}</p>`,
                  text: contentToSave,
                });

                console.log("📩 Contenido enviado por mail");
              }

              // 3. Registro de evidencia en Supabase para auditoría y KPIs (RNF7)
              await supabase.from("messages").insert({
                type: reminder.channel === "email" ? "MAIL" : "WSP",
                content: contentToSave,
                ticket_id: ticket.id,
                reminder_id: reminder.id,
              });

              console.log("✅ Mensaje guardado en BD");

              totalMensajesEnviados++;
            }
          }
        }
      }
    }

    return res.json({
      success: true,
      processed: totalMensajesEnviados,
      message: `Proceso completado. Se generaron ${totalMensajesEnviados} mensajes nuevos con GPT-4o-mini.`,
    });
  } catch (error: any) {
    console.error("Error crítico en proceso automático:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

export const verifyWebhook = (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
};

export const handleIncomingMessage = async (req: Request, res: Response) => {
  try {
    const body = req.body;

    // Log para ver en Vercel exactamente qué llega cuando enviás un WhatsApp
    console.log("Nuevo Webhook recibido:", JSON.stringify(body, null, 2));

    // Validar que el objeto sea de WhatsApp
    if (body.object === "whatsapp_business_account") {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const message = value?.messages?.[0];

      if (message) {
        const from = message.from; // Número de teléfono del cliente
        const text = message.text?.body; // Contenido del mensaje

        console.log(`Mensaje de ${from}: ${text}`);

        // Aquí es donde ACI cumple el RF.12 (Seguimiento de interacciones)
        // Guardarías en la base de datos de Supabase vinculando al cliente [cite: 131, 212]
      }

      // IMPORTANTE: Meta exige un 200 OK rápido para no reintentar el envío
      return res.status(200).send("EVENT_RECEIVED");
    }

    return res.sendStatus(404);
  } catch (error) {
    console.error("Error en handleIncomingMessage:", error);
    return res.sendStatus(500);
  }
};
