import { Request, Response } from "express";
import { Reminder } from "../models/index.js";

export const getAll = async (req: Request, res: Response) => {
  const { companyId } = (req as any).user;

  const reminders = await Reminder.findAll({
    where: { companyId },
    order: [["daysFromDue", "ASC"]], 
  });

  return res.json(reminders);
};

export const create = async (req: Request, res: Response) => {
  const { companyId } = (req as any).user;
  const { daysFromDue, channel, template } = req.body;

  if (daysFromDue == null || !channel || !template) {
    return res.status(400).json({ error: "daysFromDue, template y channel son requeridos" });
  }

  const reminder = await Reminder.create({
    companyId,
    daysFromDue,
    channel,
    template: template || null,
  });

  return res.status(201).json(reminder);
};

export const getById = async (req: Request, res: Response) => {
  const { companyId } = (req as any).user;
  const reminder = await Reminder.findOne({
    where: { id: req.params.id, companyId },
  });
  if (!reminder) return res.status(404).json({ error: "No encontrado" });
  return res.json(reminder);
};

export const updateById = async (req: Request, res: Response) => {
  const { companyId } = (req as any).user;
  const reminder = await Reminder.findOne({
    where: { id: req.params.id, companyId },
  });
  if (!reminder) return res.status(404).json({ error: "No encontrado" });

  const { daysFromDue, channel, template } = req.body;
  if (daysFromDue !== undefined) reminder.daysFromDue = daysFromDue;
  if (channel !== undefined) reminder.channel = channel;
  if (template !== undefined) reminder.template = template;

  await reminder.save();
  return res.json(reminder);
};

export const removeById = async (req: Request, res: Response) => {
  const { companyId } = (req as any).user;
  const deleted = await Reminder.destroy({
    where: { id: req.params.id, companyId },
  });
  return res.json({ deleted });
};
