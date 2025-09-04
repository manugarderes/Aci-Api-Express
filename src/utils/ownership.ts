import { Client, Ticket, Message } from "../models/index.js";

export const assertClientBelongs = async (clientId: number, companyId: number) => {
  const client = await Client.findOne({ where: { id: clientId, companyId } });
  if (!client) throw Object.assign(new Error("Cliente no pertenece a tu compañía"), { status: 403 });
  return client;
};

export const assertTicketBelongs = async (ticketId: number, companyId: number) => {
  const ticket = await Ticket.findOne({
    where: { id: ticketId },
    include: [{ model: Client, as: "client", where: { companyId }, required: true }],
  });
  if (!ticket) throw Object.assign(new Error("Ticket no pertenece a tu compañía"), { status: 403 });
  return ticket;
};

export const assertMessageBelongs = async (messageId: number, companyId: number) => {
  const message = await Message.findOne({
    where: { id: messageId },
    include: [{
      model: Ticket, as: "ticket",
      include: [{ model: Client, as: "client", where: { companyId }, required: true }],
      required: true
    }]
  });
  if (!message) throw Object.assign(new Error("Mensaje no pertenece a tu compañía"), { status: 403 });
  return message;
};
