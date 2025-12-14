import { Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import type { Client } from "../models/Client.js";


export const create = async (req: Request, res: Response) => {
  const { companyId } = (req as any).user;
  const { name, email, phone, points } = req.body || {};

  if (!name || !email || !phone || points === undefined) {
    return res.status(400).json({ error: "Todos los campos son requeridos" });
  }

  const { data: client, error } = await supabase
    .from("clients")
    .insert({
      name,
      email,
      phone,
      points,
      company_id: companyId,
    })
    .select()
    .single<Client>();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json(client);
};


export const getAll = async (req: Request, res: Response) => {
  const { companyId } = (req as any).user;

  const { data: clients, error } = await supabase
    .from("clients")
    .select("*")
    .eq("company_id", companyId)
    .order("id");

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json(clients);
};

export const getById = async (req: Request, res: Response) => {
  const { companyId } = (req as any).user;
  const id = Number(req.params.id);

  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .eq("company_id", companyId)
    .single<Client>();

  if (error || !client) {
    return res.status(404).json({ error: "No encontrado" });
  }

  return res.json(client);
};


export const updateById = async (req: Request, res: Response) => {
  const { companyId } = (req as any).user;
  const id = Number(req.params.id);
  const { name, email, phone, points } = req.body || {};

  if (!name || !email || !phone || points === undefined) {
    return res.status(400).json({ error: "Todos los campos son requeridos" });
  }

  const { data: client, error } = await supabase
    .from("clients")
    .update({
      name,
      email,
      phone,
      points,
    })
    .eq("id", id)
    .eq("company_id", companyId)
    .select()
    .single<Client>();

  if (error || !client) {
    return res.status(404).json({ error: "No encontrado" });
  }

  return res.json(client);
};


export const removeById = async (req: Request, res: Response) => {
  const { companyId } = (req as any).user;
  const id = Number(req.params.id);

  const { error, count } = await supabase
    .from("clients")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("company_id", companyId);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json({ deleted: count === 1 });
};
