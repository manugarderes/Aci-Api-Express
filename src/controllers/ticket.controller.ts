import { Request, Response } from "express";
import crypto from "crypto";
import { supabase } from "../config/supabase.js";
import type { Ticket } from "../models/Ticket.js";
import type { Client } from "../models/Client.js";

/* =========================
   CREATE
========================= */
export const create = async (req: Request, res: Response) => {
  const { company_id } = (req as any).user;
  const { total, currency, due_date, ticket_url, client_id } = req.body || {};

  // campos requeridos
  if (
    total === undefined ||
    !currency ||
    !due_date ||
    !ticket_url ||
    !client_id
  ) {
    return res.status(400).json({ error: "Todos los campos son requeridos" });
  }

  // validar total > 0
  const totalNum = Number(total);
  if (!isFinite(totalNum) || totalNum <= 0) {
    return res
      .status(400)
      .json({ error: "total debe ser un número mayor a 0" });
  }

  // validar due_date es una fecha válida
  if (typeof due_date !== "string" || isNaN(Date.parse(due_date))) {
    return res
      .status(400)
      .json({ error: "due_date debe ser una fecha válida (ISO string)" });
  }

  // validar que el cliente pertenece a la empresa
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("id", client_id)
    .eq("company_id", company_id)
    .single<Pick<Client, "id">>();

  if (!client) {
    return res.status(403).json({ error: "Cliente inválido" });
  }

  const payment_secret = crypto.randomBytes(32).toString("hex");

  const { data: ticket, error } = await supabase
    .from("tickets")
    .insert({
      total: totalNum,
      currency,
      due_date,
      ticket_url,
      payment_url: null,
      payment_secret,
      paid: false,
      client_id,
    })
    .select()
    .single<Ticket>();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json(ticket);
};

/* =========================
   GET ALL UNPAID
========================= */
export const getAllUnPaid = async (req: Request, res: Response) => {
  const { company_id } = (req as any).user;

  const { data: tickets, error } = await supabase
    .from("tickets")
    .select(
      `
      *,
      client:clients!inner (*)
    `
    )
    .eq("paid", false)
    .eq("client.company_id", company_id)
    .order("due_date", { ascending: true });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json(tickets);
};

/* =========================
   GET ALL PAID
========================= */
export const getAllPaid = async (req: Request, res: Response) => {
  const { company_id } = (req as any).user;

  const { data: tickets, error } = await supabase
    .from("tickets")
    .select(
      `
      *,
      client:clients!inner (*)
    `
    )
    .eq("paid", true)
    .eq("client.company_id", company_id)
    .order("due_date", { ascending: true });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json(tickets);
};

/* =========================
   GET BY ID
========================= */
export const getById = async (req: Request, res: Response) => {
  const { company_id } = (req as any).user;
  const id = Number(req.params.id);

  const { data: ticket, error } = await supabase
    .from("tickets")
    .select(
      `
      *,
      client:clients!inner (*)
    `
    )
    .eq("id", id)
    .eq("client.company_id", company_id)
    .single<Ticket & { client: Client }>();

  if (error || !ticket) {
    return res.status(404).json({ error: "No encontrado" });
  }

  return res.json(ticket);
};

/* =========================
   UPDATE
========================= */
export const updateById = async (req: Request, res: Response) => {
  const { company_id } = (req as any).user;
  const id = Number(req.params.id);

  const {
    total,
    currency,
    due_date,
    ticket_url,
    payment_url,
    payment_secret,
    paid,
    client_id,
  } = req.body || {};

  if (
    total === undefined ||
    !currency ||
    !due_date ||
    !ticket_url ||
    !client_id
  ) {
    return res.status(400).json({ error: "Todos los campos son requeridos" });
  }

  // validar total > 0
  const totalNum = Number(total);
  if (!isFinite(totalNum) || totalNum <= 0) {
    return res
      .status(400)
      .json({ error: "total debe ser un número mayor a 0" });
  }

  // validar due_date es una fecha válida
  if (typeof due_date !== "string" || isNaN(Date.parse(due_date))) {
    return res
      .status(400)
      .json({ error: "due_date debe ser una fecha válida (ISO string)" });
  }

  // validar cliente
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("id", client_id)
    .eq("company_id", company_id)
    .single<Pick<Client, "id">>();

  if (!client) {
    return res.status(403).json({ error: "Cliente inválido" });
  }

  // validar que el ticket pertenece a la empresa
  const { data: existing } = await supabase
    .from("tickets")
    .select(
      `
      id,
      client:clients!inner (company_id)
    `
    )
    .eq("id", id)
    .eq("client.company_id", company_id)
    .single();

  if (!existing) {
    return res.status(404).json({ error: "No encontrado" });
  }

  const { data: ticket, error } = await supabase
    .from("tickets")
    .update({
      total: totalNum,
      currency,
      due_date,
      ticket_url,
      payment_url,
      payment_secret,
      paid: !!paid,
      client_id,
    })
    .eq("id", id)
    .select()
    .single<Ticket>();

  if (error || !ticket) {
    return res.status(500).json({ error: error?.message });
  }

  return res.json(ticket);
};

export const removeById = async (req: Request, res: Response) => {
  const { company_id } = (req as any).user;
  const id = Number(req.params.id);

  // validar pertenencia
  const { data: ticket } = await supabase
    .from("tickets")
    .select(
      `
      id,
      client:clients!inner (company_id)
    `
    )
    .eq("id", id)
    .eq("client.company_id", company_id)
    .single();

  if (!ticket) {
    return res.status(404).json({ error: "No encontrado" });
  }

  const { error } = await supabase.from("tickets").delete().eq("id", id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json({ deleted: true });
};

export const getAllByClient = async (req: Request, res: Response) => {
  const { company_id } = (req as any).user;
  const client_id = Number(req.params.clientId);

  // validar cliente
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("id", client_id)
    .eq("company_id", company_id)
    .single<Pick<Client, "id">>();

  if (!client) {
    return res.status(403).json({ error: "Cliente inválido" });
  }

  const { data: tickets, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("client_id", client_id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json(tickets);
};

export const payWithSecret = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { secret, receipt_url } = req.body || {};

  if (!secret || !receipt_url) {
    return res
      .status(400)
      .json({ error: "secret y receipt_url son requeridos" });
  }

  const { data: ticket, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", id)
    .single<Ticket>();

  if (error || !ticket) {
    return res.status(404).json({ error: "Ticket no encontrado" });
  }

  if (ticket.payment_secret !== secret) {
    return res.status(403).json({ error: "Secret inválido" });
  }

  const { data: updated, error: updateError } = await supabase
    .from("tickets")
    .update({
      payment_url: receipt_url,
    })
    .eq("id", id)
    .select()
    .single<Ticket>();

  if (updateError) {
    return res.status(500).json({ error: updateError.message });
  }

  return res.json({
    ok: true,
    id: updated.id,
    payment_url: updated.payment_url,
    paid: updated.paid,
  });
};
