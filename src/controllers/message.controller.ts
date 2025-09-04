import { Request, Response } from "express";
import { Message, Ticket, Client } from "../models/index.js";
import { assertMessageBelongs, assertTicketBelongs } from "../utils/ownership.js";

export const create = async (req: Request, res: Response) => {
  const { companyId } = (req as any).user;
  const { type, content, ticketId } = req.body || {};
  if (!type || !content || !ticketId) {
    return res.status(400).json({ error: "type, content y ticketId son requeridos" });
  }

  await assertTicketBelongs(Number(ticketId), companyId);
  const msg = await Message.create({ type, content, ticketId });
  return res.status(201).json(msg);
};

export const getAll = async (req: Request, res: Response) => {
  const { companyId } = (req as any).user;
  const messages = await Message.findAll({
    include: [{
      model: Ticket, as: "ticket",
      include: [{ model: Client, as: "client", where: { companyId }, required: true }],
      required: true
    }]
  });
  return res.json(messages);
};

export const getById = async (req: Request, res: Response) => {
  const { companyId } = (req as any).user;
  const id = Number(req.params.id);
  const message = await Message.findOne({
    where: { id },
    include: [{
      model: Ticket, as: "ticket",
      include: [{ model: Client, as: "client", where: { companyId }, required: true }],
      required: true
    }]
  });
  if (!message) return res.status(404).json({ error: "No encontrado" });
  return res.json(message);
};

export const updateById = async (req: Request, res: Response) => {
  const { companyId } = (req as any).user;
  const id = Number(req.params.id);
  const message = await assertMessageBelongs(id, companyId);

  const { type, content, ticketId } = req.body || {};
  if (ticketId !== undefined && ticketId !== message.ticketId) {
    await assertTicketBelongs(Number(ticketId), companyId);
    message.ticketId = Number(ticketId);
  }
  if (type !== undefined) (message as any).type = type;
  if (content !== undefined) message.content = content;

  await message.save();
  return res.json(message);
};

export const removeById = async (req: Request, res: Response) => {
  const { companyId } = (req as any).user;
  const id = Number(req.params.id);
  await assertMessageBelongs(id, companyId);
  const deleted = await Message.destroy({ where: { id } });
  return res.json({ deleted });
};
