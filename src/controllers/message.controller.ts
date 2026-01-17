import { Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI,
});

const generateAIContent = async (ticket: any, reminder: any) => {
  try {
    const systemPrompt = `Actúa como un agente de cobranza profesional para la empresa "${ticket.client?.company?.name}". Tu tarea es redactar recordatorios de pago efectivos y cordiales.`;

    const userPrompt = `
      Redacta un mensaje para el cliente "${ticket.client?.name}".
      
      Datos de la deuda:
      - Monto: ${ticket.currency} ${ticket.total}
      - Vencimiento: ${ticket.due_date}
      - Canal de envío: ${reminder.channel}
      - Instrucción base: ${reminder.template}
      
      Reglas de formato:
      1. Si es WhatsApp: Usa emojis, sé breve y directo.
      2. Si es Email: Usa un asunto claro y cuerpo formal.
      3. No inventes enlaces. Solo menciona que puede subir su comprobante en el portal de pagos.
      4. Devuelve SOLO el texto del mensaje, sin comillas ni introducciones.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Modelo rápido y económico
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const text = completion.choices[0].message.content;

    if (!text) throw new Error("OpenAI devolvió una respuesta vacía.");

    return text;
  } catch (err: any) {
    console.error("Error en OpenAI:", err.message);
    return `Hola ${ticket.client?.name}, le recordamos que su factura de ${ticket.currency} ${ticket.total} con vencimiento el ${ticket.due_date} se encuentra pendiente.`;
  }
};

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
            id, name, email, company_id,
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
              .eq("reminder_id", reminder.id)
              .maybeSingle();

            if (!existingMessage) {
              const aiContent = await generateAIContent(ticket, reminder);

              await supabase.from("messages").insert({
                type: reminder.channel === "email" ? "MAIL" : "WSP",
                content: aiContent,
                ticket_id: ticket.id,
                reminder_id: reminder.id,
              });

              totalMensajesEnviados++;
              console.log(
                `[OpenAI] Mensaje generado para ticket #${ticket.id}`,
              );
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
