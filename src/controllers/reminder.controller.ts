import { Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import type { Reminder } from "../models/Reminder.js";

export const getAll = async (req: Request, res: Response) => {
  const { company_id } = (req as any).user;

  const { data: reminders, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("company_id", company_id)
    .order("days_from_due", { ascending: true });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json(reminders);
};

export const create = async (req: Request, res: Response) => {
  const { company_id } = (req as any).user;
  const { days_from_due, channel, template } = req.body;

  if (
    days_from_due === undefined ||
    channel === undefined ||
    template === undefined
  ) {
    return res.status(400).json({ error: "Todos los campos son requeridos" });
  }

  const { data: reminder, error } = await supabase
    .from("reminders")
    .insert({
      company_id,
      days_from_due: Number(days_from_due),
      channel,
      template,
    })
    .select()
    .single<Reminder>();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json(reminder);
};

export const getById = async (req: Request, res: Response) => {
  const { company_id } = (req as any).user;
  const id = Number(req.params.id);

  const { data: reminder, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("id", id)
    .eq("company_id", company_id)
    .single<Reminder>();

  if (error || !reminder) {
    return res.status(404).json({ error: "No encontrado" });
  }

  return res.json(reminder);
};

export const updateById = async (req: Request, res: Response) => {
  const { company_id } = (req as any).user;
  const id = Number(req.params.id);
  const { days_from_due, channel, template } = req.body;

  if (
    days_from_due === undefined ||
    channel === undefined ||
    template === undefined
  ) {
    return res.status(400).json({ error: "Todos los campos son requeridos" });
  }

  const { data: reminder, error } = await supabase
    .from("reminders")
    .update({
      days_from_due: Number(days_from_due),
      channel,
      template,
    })
    .eq("id", id)
    .eq("company_id", company_id)
    .select()
    .single<Reminder>();

  if (error || !reminder) {
    return res.status(404).json({ error: "No encontrado" });
  }

  return res.json(reminder);
};

export const removeById = async (req: Request, res: Response) => {
  const { company_id } = (req as any).user;
  const id = Number(req.params.id);

  const { error, count } = await supabase
    .from("reminders")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("company_id", company_id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json({ deleted: count === 1 });
};
