import { Request, Response } from "express";
import { Message, Ticket, Client } from "../models/index.js";

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