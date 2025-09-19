import { Request, Response } from "express";
import { Client } from "../models/index.js";

export const create = async (req: Request, res: Response) => {
  const { companyId } = (req as any).user;
  const { name, email, phone, points } = req.body || {};
  if (!name || !email || !phone || !points) {
    return res.status(400).json({ error: "Todos los campos son requeridos" });
  }
  const client = await Client.create({ name, email, phone, points, companyId });
  return res.status(201).json(client);
};

export const getAll = async (req: Request, res: Response) => {
  const { companyId } = (req as any).user;
  const clients = await Client.findAll({ where: { companyId } });
  return res.json(clients);
};

export const getById = async (req: Request, res: Response) => {
  const { companyId } = (req as any).user;
  const id = Number(req.params.id);
  const client = await Client.findOne({ where: { id, companyId } });
  if (!client) return res.status(404).json({ error: "No encontrado" });
  return res.json(client);
};

export const updateById = async (req: Request, res: Response) => {
  const { companyId } = (req as any).user;
  const id = Number(req.params.id);
  const client = await Client.findOne({ where: { id, companyId } });
  if (!client) return res.status(404).json({ error: "No encontrado" });

  const { name, email, phone, points } = req.body || {};
  if (!name || !email || !phone || !points) {
    return res.status(400).json({ error: "Todos los campos son requeridos" });
  }
  if (name !== undefined) client.name = name;
  if (email !== undefined) client.email = email;
  if (phone !== undefined) client.phone = phone;
  if (points !== undefined) client.points = points;
  await client.save();
  return res.json(client);
};

export const removeById = async (req: Request, res: Response) => {
  const { companyId } = (req as any).user;
  const id = Number(req.params.id);
  const deleted = await Client.destroy({ where: { id, companyId } });
  return res.json({ deleted });
};
