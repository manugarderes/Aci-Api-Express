import OpenAIModule from "openai";

export const generateAIContent = async (ticket: any, reminder: any) => {
  const OpenAI: any = (OpenAIModule as any).default ?? OpenAIModule;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const openai = new OpenAI({ apiKey });
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
    `.trim();

    const resp = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_output_tokens: 300,
    });

    const text = resp.output_text?.trim();
    if (!text) throw new Error("OpenAI devolvió una respuesta vacía.");

    return text;
  } catch (err: any) {
    console.error("Error en OpenAI:", err?.message || err);
    return `Hola ${ticket.client?.name}, le recordamos que su factura de ${ticket.currency} ${ticket.total} con vencimiento el ${ticket.due_date} se encuentra pendiente.`;
  }
};
