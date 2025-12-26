import { Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import type { Client } from "../models/Client.js";

const requireFields = (obj: any, fields: string[]) => {
  const missing = fields.filter((f) => {
    const v = obj?.[f];
    return (
      v === undefined ||
      v === null ||
      (typeof v === "string" && v.trim() === "")
    );
  });
  return missing.length ? missing : null;
};

// validadores adicionales
const isValidEmail = (email: unknown) => {
  if (typeof email !== "string") return false;
  // validación simple pero robusta: user@domain.tld (tld >=2)
  const re = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return re.test(email.trim());
};

// E.164-like: comienza con + seguido de 8 a 15 dígitos
const isValidPhone = (phone: unknown) => {
  if (typeof phone !== "string") return false;
  const re = /^\+\d{8,15}$/;
  return re.test(phone.trim());
};

const existsUnique = async (
  company_id: number,
  field: "name" | "email" | "phone",
  value: string,
  excludeId?: number
) => {
  let builder = supabase
    .from("clients")
    .select("id")
    .eq("company_id", company_id)
    .eq(field, value);
  if (excludeId !== undefined) builder = (builder as any).neq("id", excludeId);
  const { data } = await (builder as any).maybeSingle();
  return Boolean(data);
};

const checkAllUnique = async (
  company_id: number,
  payload: any,
  excludeId?: number
) => {
  if (
    payload.name &&
    (await existsUnique(company_id, "name", payload.name, excludeId))
  )
    return { field: "name", message: "El nombre ya existe para esta compañía" };
  if (
    payload.email &&
    (await existsUnique(company_id, "email", payload.email, excludeId))
  )
    return { field: "email", message: "El email ya existe para esta compañía" };
  if (
    payload.phone &&
    (await existsUnique(company_id, "phone", payload.phone, excludeId))
  )
    return {
      field: "phone",
      message: "El teléfono ya existe para esta compañía",
    };
  return null;
};

export const create = async (req: Request, res: Response) => {
  const { company_id } = (req as any).user;
  const { name, email, phone, points } = req.body || {};

  const missing = requireFields({ name, email, phone, points }, [
    "name",
    "email",
    "phone",
    "points",
  ]);
  if (missing)
    return res
      .status(400)
      .json({ error: `Faltan campos: ${missing.join(", ")}` });

  // validaciones de formato
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Email inválido" });
  }
  if (!isValidPhone(phone)) {
    return res
      .status(400)
      .json({
        error:
          "Teléfono inválido. Debe comenzar con '+' y contener entre 8 y 15 dígitos.",
      });
  }

  const conflict = await checkAllUnique(company_id, { name, email, phone });
  if (conflict) return res.status(409).json({ error: conflict.message });

  const { data: client, error } = await supabase
    .from("clients")
    .insert({ name, email, phone, points, company_id })
    .select()
    .single<Client>();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json(client);
};

export const getAll = async (req: Request, res: Response) => {
  const { company_id } = (req as any).user;
  const { data: clients, error } = await supabase
    .from("clients")
    .select("*")
    .eq("company_id", company_id)
    .order("id");
  if (error) return res.status(500).json({ error: error.message });
  return res.json(clients);
};

export const getById = async (req: Request, res: Response) => {
  const { company_id } = (req as any).user;
  const id = Number(req.params.id);
  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .eq("company_id", company_id)
    .single<Client>();
  if (error || !client) return res.status(404).json({ error: "No encontrado" });
  return res.json(client);
};

export const updateById = async (req: Request, res: Response) => {
  const { company_id } = (req as any).user;
  const id = Number(req.params.id);
  const { name, email, phone, points } = req.body || {};

  const missing = requireFields({ name, email, phone, points }, [
    "name",
    "email",
    "phone",
    "points",
  ]);
  if (missing)
    return res
      .status(400)
      .json({ error: `Faltan campos: ${missing.join(", ")}` });

  // validaciones de formato en update también
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Email inválido" });
  }
  if (!isValidPhone(phone)) {
    return res
      .status(400)
      .json({
        error:
          "Teléfono inválido. Debe comenzar con '+' y contener entre 8 y 15 dígitos.",
      });
  }

  const conflict = await checkAllUnique(company_id, { name, email, phone }, id);
  if (conflict) return res.status(409).json({ error: conflict.message });

  const { data: client, error } = await supabase
    .from("clients")
    .update({ name, email, phone, points })
    .eq("id", id)
    .eq("company_id", company_id)
    .select()
    .single<Client>();

  if (error || !client) return res.status(404).json({ error: "No encontrado" });
  return res.json(client);
};

export const removeById = async (req: Request, res: Response) => {
  const { company_id } = (req as any).user;
  const id = Number(req.params.id);

  // verificar si existen tickets vinculados al cliente
  const { data: linkedTicket, error: ticketError } = await supabase
    .from("tickets")
    .select("id")
    .eq("client_id", id)
    .limit(1)
    .maybeSingle();

  if (ticketError) {
    return res.status(500).json({ error: ticketError.message });
  }

  if (linkedTicket) {
    return res
      .status(400)
      .json({ error: "El cliente tiene tickets vinculados y no puede eliminarse" });
  }

  const { error, count } = await supabase
    .from("clients")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("company_id", company_id);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ deleted: count === 1 });
};
