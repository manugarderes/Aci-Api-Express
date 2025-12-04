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

  if (!daysFromDue || !channel || !template) {
    return res.status(400).json({ error: "Todos los campos son requeridos" });
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


  if (daysFromDue === undefined || channel === undefined || template === undefined) {
    return res.status(400).json({ error: "Todos los campos son requeridos" });
  }

  reminder.daysFromDue = Number(daysFromDue);
  reminder.channel = channel;
  reminder.template = template;

  console.log(reminder);
  

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
