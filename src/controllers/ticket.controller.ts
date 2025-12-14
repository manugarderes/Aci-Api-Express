import { Request, Response } from "express";
import crypto from "crypto";
import { supabase } from "../config/supabase.js";
import type { Ticket } from "../models/Ticket.js";
import type { Client } from "../models/Client.js";

export const create = async (req: Request, res: Response) => {
  const { companyId } = (req as any).user;
  const { total, currency, dueDate, ticketUrl, clientId } = req.body || {};

  if (!total || !currency || !dueDate || !ticketUrl || !clientId) {
    return res.status(400).json({ error: "Todos los campos son requeridos" });
  }

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("company_id", companyId)
    .single<Pick<Client, "id">>();

  if (!client) {
    return res.status(403).json({ error: "Cliente inválido" });
  }

  const paymentSecret = crypto.randomBytes(32).toString("hex");

  const { data: ticket, error } = await supabase
    .from("tickets")
    .insert({
      total,
      currency,
      due_date: dueDate,
      ticket_url: ticketUrl,
      payment_url: null,
      payment_secret: paymentSecret,
      paid: false,
      client_id: clientId,
    })
    .select()
    .single<Ticket>();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json(ticket);
};

export const getAllUnPaid = async (req: Request, res: Response) => {
  const { companyId } = (req as any).user;

  const { data: tickets, error } = await supabase
    .from("tickets")
    .select(`
      *,
      client:clients (*)
    `)
    .eq("paid", false)
    .eq("client.company_id", companyId)
    .order("due_date", { ascending: true });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json(tickets);
};

export const getAllPaid = async (req: Request, res: Response) => {
  const { companyId } = (req as any).user;

  const { data: tickets, error } = await supabase
    .from("tickets")
    .select(`
      *,
      client:clients (*)
    `)
    .eq("paid", true)
    .eq("client.company_id", companyId)
    .order("due_date", { ascending: true });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json(tickets);
};

export const getById = async (req: Request, res: Response) => {
  const { companyId } = (req as any).user;
  const id = Number(req.params.id);

  const { data: ticket, error } = await supabase
    .from("tickets")
    .select(`
      *,
      client:clients (*)
    `)
    .eq("id", id)
    .eq("client.company_id", companyId)
    .single<Ticket & { client: Client }>();

  if (error || !ticket) {
    return res.status(404).json({ error: "No encontrado" });
  }

  return res.json(ticket);
};

export const updateById = async (req: Request, res: Response) => {
  const { companyId } = (req as any).user;
  const id = Number(req.params.id);

  const { total, currency, dueDate, ticketUrl, paymentUrl, paymentSecret, paid, clientId } =
    req.body || {};

  if (!total || !currency || !dueDate || !ticketUrl || !clientId) {
    return res.status(400).json({ error: "Todos los campos son requeridos" });
  }

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("company_id", companyId)
    .single<Pick<Client, "id">>();

  if (!client) {
    return res.status(403).json({ error: "Cliente inválido" });
  }

  const { data: ticket, error } = await supabase
    .from("tickets")
    .update({
      total,
      currency,
      due_date: dueDate,
      ticket_url: ticketUrl,
      payment_url: paymentUrl,
      payment_secret: paymentSecret,
      paid: !!paid,
      client_id: clientId,
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
  const { companyId } = (req as any).user;
  const id = Number(req.params.id);

  const { error, count } = await supabase
    .from("tickets")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("client.company_id", companyId);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json({ deleted: count === 1 });
};

export const getAllByClient = async (req: Request, res: Response) => {
  const { companyId } = (req as any).user;
  const clientId = Number(req.params.clientId);

  const { data: tickets, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("client_id", clientId)
    .eq("client.company_id", companyId);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json(tickets);
};

export const payWithSecret = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { secret, receiptUrl } = req.body || {};

  if (!secret || !receiptUrl) {
    return res.status(400).json({ error: "secret y receiptUrl son requeridos" });
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
      payment_url: receiptUrl,
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
    paymentUrl: updated.payment_url,
    paid: updated.paid,
  });
};
