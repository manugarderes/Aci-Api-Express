import { Request, Response } from "express";
import { Ticket, Client } from "../models/index.js";
import { assertClientBelongs, assertTicketBelongs } from "../utils/ownership.js";
import crypto from "crypto";

export const create = async (req: Request, res: Response) => {
  const { companyId } = (req as any).user;
  const { total, dueDate, ticketUrl, clientId } = req.body || {};

  if (clientId == null || total == null) {
    return res.status(400).json({ error: "total y clientId son requeridos" });
  }

  await assertClientBelongs(Number(clientId), companyId);

  const paymentSecret = crypto.randomBytes(32).toString("hex");

  const ticket = await Ticket.create({
    total,
    dueDate: dueDate ? new Date(dueDate) : null,
    ticketUrl: ticketUrl || null,
    paymentUrl: null,
    paymentSecret,
    paid: false,
    clientId,
  });

  return res.status(201).json(ticket);
};

export const getAll = async (req: Request, res: Response) => {
  const { companyId } = (req as any).user;
  const tickets = await Ticket.findAll({
    include: [{ model: Client, as: "client", where: { companyId }, required: true }],
  });
  return res.json(tickets);
};

export const getById = async (req: Request, res: Response) => {
  const { companyId } = (req as any).user;
  const id = Number(req.params.id);
  const ticket = await Ticket.findOne({
    where: { id },
    include: [{ model: Client, as: "client", where: { companyId }, required: true }],
  });
  if (!ticket) return res.status(404).json({ error: "No encontrado" });
  return res.json(ticket);
};

export const updateById = async (req: Request, res: Response) => {
  const { companyId } = (req as any).user;
  const id = Number(req.params.id);
  const ticket = await assertTicketBelongs(id, companyId);

  const { total, dueDate, ticketUrl, paymentUrl, paymentSecret, paid, clientId } = req.body || {};

  if (clientId !== undefined && clientId !== ticket.clientId) {
    await assertClientBelongs(Number(clientId), companyId);
    ticket.clientId = Number(clientId);
  }
  if (total !== undefined) ticket.total = total;
  if (dueDate !== undefined) ticket.dueDate = dueDate ? new Date(dueDate) : null;
  if (ticketUrl !== undefined) ticket.ticketUrl = ticketUrl;
  if (paymentUrl !== undefined) ticket.paymentUrl = paymentUrl;
  if (paymentSecret !== undefined) ticket.paymentSecret = paymentSecret;
  if (paid !== undefined) ticket.paid = !!paid;

  await ticket.save();
  return res.json(ticket);
};

export const removeById = async (req: Request, res: Response) => {
  const { companyId } = (req as any).user;
  const id = Number(req.params.id);
  await assertTicketBelongs(id, companyId);
  const deleted = await Ticket.destroy({ where: { id } });
  return res.json({ deleted });
};

export const getAllByClient = async (req: Request, res: Response) => {
  const { companyId } = (req as any).user;
  const clientId = Number(req.params.clientId);
  await assertClientBelongs(clientId, companyId);
  const tickets = await Ticket.findAll({ where: { clientId } });
  return res.json(tickets);
};

export const payWithSecret = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { secret, receiptUrl } = req.body || {};
  if (!secret || !receiptUrl) {
    return res.status(400).json({ error: "secret y receiptUrl son requeridos" });
  }
  const ticket = await Ticket.findByPk(id);
  if (!ticket) return res.status(404).json({ error: "Ticket no encontrado" });
  if (ticket.paymentSecret !== secret) {
    return res.status(403).json({ error: "Secret inválido" });
  }
  ticket.paymentUrl = receiptUrl;
  await ticket.save();
  return res.json({ ok: true, id: ticket.id, paymentUrl: ticket.paymentUrl, paid: ticket.paid });
};
