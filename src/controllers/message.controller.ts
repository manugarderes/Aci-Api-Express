import { Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import type { Message } from "../models/Message.js";
import type { Ticket } from "../models/Ticket.js";
import type { Client } from "../models/Client.js";

export const getAll = async (req: Request, res: Response) => {
  const { company_id } = (req as any).user;

  const { data: messages, error } = await supabase
    .from("messages")
    .select(
      `
      *,
      ticket:tickets!inner (
        *,
        client:clients!inner (*)
      )
    `
    )
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
    .select(
      `
      *,
      ticket:tickets!inner (
        *,
        client:clients!inner (*)
      )
    `
    )
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

export const processAutomatedReminders = async (req: any, res: any) => {
  try {
    const { data: companies, error: compError } = await supabase
      .from("companies")
      .select("id");

    if (compError) throw compError;

    console.log("Buscando igualdades...");

    for (const company of companies) {
      const { data: reminders } = await supabase
        .from("reminders")
        .select("*")
        .eq("company_id", company.id);

      const { data: allTickets } = await supabase
        .from("tickets")
        .select("*, clients!inner(company_id)")
        .eq("clients.company_id", company.id)
        .eq("paid", false);

      if (!reminders || !allTickets) continue;

      const tickets = allTickets.filter(
        (ticket) => !ticket.payment_url || ticket.payment_url.trim().length <= 5
      );

      const today = new Date();

      for (const reminder of reminders) {
        for (const ticket of tickets) {
          const dueDate = new Date(ticket.due_date);
          const diffTime = today.getTime() - dueDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === reminder.days_from_due) {
            console.log("Igualdad encontrada");
            const { data: existingMessage } = await supabase
              .from("messages")
              .select("id")
              .eq("ticket_id", ticket.id)
              .eq("reminder_id", reminder.id)
              .maybeSingle();

            if (!existingMessage) {
              //TODO: Crear content usando la api de OpenAI
              await supabase.from("messages").insert({
                type: reminder.channel == "email" ? "MAIL" : "WSP",
                content: `TEST en base a ${reminder.template}`,
                ticket_id: ticket.id,
                reminder_id: reminder.id,
              });
              //TODO: Enviar mensaje via MAIL o WSP
              console.log("Nuevo mensaje creado");
            } else {
              console.log("Ya existe el mensaje");
            }
          }
        }
      }
    }
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
