import { Request, Response } from "express";
import crypto from "crypto";
import { supabase } from "../config/supabase.js";
import type { Ticket } from "../models/Ticket.js";
import type { Client } from "../models/Client.js";

export const create = async (req: Request, res: Response) => {
  const { company_id } = (req as any).user;
  const { total, currency, due_date, ticket_url, client_id } = req.body || {};

  if (!total || !currency || !due_date || !ticket_url || !client_id) {
    return res.status(400).json({ error: "Todos los campos son requeridos" });
  }

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
      total,
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

export const getAllUnPaid = async (req: Request, res: Response) => {
  const { company_id } = (req as any).user;

  const { data: tickets, error } = await supabase
    .from("tickets")
    .select(`
      *,
      client:clients (*)
    `)
    .eq("paid", false)
    .eq("client.company_id", company_id)
    .order("due_date", { ascending: true });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json(tickets);
};

export const getAllPaid = async (req: Request, res: Response) => {
  const { company_id } = (req as any).user;

  const { data: tickets, error } = await supabase
    .from("tickets")
    .select(`
      *,
      client:clients (*)
    `)
    .eq("paid", true)
    .eq("client.company_id", company_id)
    .order("due_date", { ascending: true });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json(tickets);
};

export const getById = async (req: Request, res: Response) => {
  const { company_id } = (req as any).user;
  const id = Number(req.params.id);

  const { data: ticket, error } = await supabase
    .from("tickets")
    .select(`
      *,
      client:clients (*)
    `)
    .eq("id", id)
    .eq("client.company_id", company_id)
    .single<Ticket & { client: Client }>();

  if (error || !ticket) {
    return res.status(404).json({ error: "No encontrado" });
  }

  return res.json(ticket);
};

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

  if (!total || !currency || !due_date || !ticket_url || !client_id) {
    return res.status(400).json({ error: "Todos los campos son requeridos" });
  }

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("id", client_id)
    .eq("company_id", company_id)
    .single<Pick<Client, "id">>();

  if (!client) {
    return res.status(403).json({ error: "Cliente inválido" });
  }

  const { data: ticket, error } = await supabase
    .from("tickets")
    .update({
      total,
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
    return res.status(404).json({ error: "No encontrado" });
  }

  return res.json(ticket);
};

export const removeById = async (req: Request, res: Response) => {
  const { company_id } = (req as any).user;
  const id = Number(req.params.id);

  const { error, count } = await supabase
    .from("tickets")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("client.company_id", company_id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json({ deleted: count === 1 });
};

export const getAllByClient = async (req: Request, res: Response) => {
  const { company_id } = (req as any).user;
  const client_id = Number(req.params.clientId);

  const { data: tickets, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("client_id", client_id)
    .eq("client.company_id", company_id);

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
