import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI,
});

export const generateAIContent = async (ticket: any, reminder: any) => {
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
