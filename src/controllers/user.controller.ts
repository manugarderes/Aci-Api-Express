import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { supabase } from "../config/supabase.js";
import type { User } from "../models/User.js";

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);

export const getAllUsers = async (req: Request, res: Response) => {
  const { companyId, isAdmin } = (req as any).user;

  if (!isAdmin) {
    return res.status(403).json({ error: "Solo administradores." });
  }

  const { data: users, error } = await supabase
    .from("users")
    .select("id, name, is_admin, company_id")
    .eq("company_id", companyId);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json(
    users?.map((u) => ({
      id: u.id,
      name: u.name,
      isAdmin: u.is_admin,
      companyId: u.company_id,
    }))
  );
};

export const createUser = async (req: Request, res: Response) => {
  const { companyId, isAdmin } = (req as any).user;

  if (!isAdmin) {
    return res.status(403).json({ error: "Solo administradores." });
  }

  const { name, password, isAdmin: newIsAdmin } = req.body || {};

  if (!name || !password) {
    return res.status(400).json({ error: "Nombre y contraseña requeridos" });
  }

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("name", name)
    .eq("company_id", companyId)
    .maybeSingle<Pick<User, "id">>();

  if (existing) {
    return res
      .status(409)
      .json({ error: "Ya existe un usuario con ese nombre" });
  }

  const hash = await bcrypt.hash(password, SALT_ROUNDS);

  const { data: user, error } = await supabase
    .from("users")
    .insert({
      name,
      password: hash,
      is_admin: !!newIsAdmin,
      company_id: companyId,
    })
    .select()
    .single<User>();

  if (error || !user) {
    return res.status(500).json({ error: error?.message });
  }

  return res.status(201).json({
    id: user.id,
    name: user.name,
    isAdmin: user.is_admin,
    companyId: user.company_id,
  });
};

export const deleteUser = async (req: Request, res: Response) => {
  const { companyId, isAdmin, userId } = (req as any).user;
  const idToDelete = Number(req.params.id);

  if (!isAdmin) {
    return res.status(403).json({ error: "Solo administradores." });
  }

  if (idToDelete === userId) {
    return res
      .status(400)
      .json({ error: "No podés eliminar tu propio usuario." });
  }

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("id", idToDelete)
    .eq("company_id", companyId)
    .single<Pick<User, "id">>();

  if (!user) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }

  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", idToDelete)
    .eq("company_id", companyId);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json({ deleted: true });
};
