import { Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import type { Message } from "../models/Message.js";
import type { Ticket } from "../models/Ticket.js";
import type { Client } from "../models/Client.js";

export const getAll = async (req: Request, res: Response) => {
  const { company_id } = (req as any).user;

  const { data: messages, error } = await supabase
    .from("messages")
    .select(`
      *,
      ticket:tickets (
        *,
        client:clients (*)
      )
    `)
    .eq("ticket.client.company_id", company_id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json(
    messages as (Message & {
      ticket: Ticket & { client: Client };
    })[]
  );
};

export const getById = async (req: Request, res: Response) => {
  const { company_id } = (req as any).user;
  const id = Number(req.params.id);

  const { data: message, error } = await supabase
    .from("messages")
    .select(`
      *,
      ticket:tickets (
        *,
        client:clients (*)
      )
    `)
    .eq("id", id)
    .eq("ticket.client.company_id", company_id)
    .single();

  if (error || !message) {
    return res.status(404).json({ error: "No encontrado" });
  }

  return res.json(
    message as Message & {
      ticket: Ticket & { client: Client };
    }
  );
};
