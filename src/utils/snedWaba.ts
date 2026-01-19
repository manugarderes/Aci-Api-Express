import axios from "axios";

export const sendWabaTemplate = async (
  to: number,
  clientName: string,
  companyName: string,
  currency: string,
  total: number,
  dueDate: string,
) => {
  const url = `https://graph.facebook.com/v19.0/${process.env.WABA_PHONE_NUMBER_ID}/messages`;

  const sentText = `Hola ${clientName}. 👋 Te contactamos de ${companyName} en relación a tu factura pendiente por un total de ${currency} ${total}, con vencimiento el día ${dueDate}. Le recordamos que mantener sus pagos al día le permite seguir disfrutando de nuestros servicios de gestión de residuos sin interrupciones. Puedes gestionar tu pago o subir tu comprobante directamente en nuestro portal. Si tienes alguna duda, estamos para ayudarte. 😊`;

  const data = {
    messaging_product: "whatsapp",
    to: to,
    type: "template",
    template: {
      name: "primer_recordatorio_cobranza",
      language: { code: "es" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: clientName }, // {{1}}
            { type: "text", text: companyName }, // {{2}}
            { type: "text", text: currency }, // {{3}}
            { type: "text", text: total.toString() }, // {{4}}
            { type: "text", text: dueDate }, // {{5}}
          ],
        },
      ],
    },
  };

  try {
    await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${process.env.WABA_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    return sentText;
  } catch (error: any) {
    console.error(
      "Error enviando WhatsApp:",
      error.response?.data || error.message,
    );
    throw new Error("Error en el servicio de mensajería externa");
  }
};
