import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { supabase } from "../config/supabase.js";
import type { User } from "../models/User.js";

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);

export const getAllUsers = async (req: Request, res: Response) => {
  const { company_id, is_admin } = (req as any).user;

  if (!is_admin) {
    return res.status(403).json({ error: "Solo administradores." });
  }

  const { data: users, error } = await supabase
    .from("users")
    .select("id, name, is_admin, company_id")
    .eq("company_id", company_id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json(users);
};

export const createUser = async (req: Request, res: Response) => {
  const { company_id, is_admin } = (req as any).user;

  if (!is_admin) {
    return res.status(403).json({ error: "Solo administradores." });
  }

  const { name, password, is_admin: new_is_admin } = req.body || {};

  if (!name || !password) {
    return res.status(400).json({ error: "Nombre y contraseña requeridos" });
  }

  // validar contraseña: al menos una mayúscula, un número y más de 5 caracteres
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      error:
        "La contraseña debe contener al menos una letra mayúscula, un número y más de 5 caracteres",
    });
  }

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("name", name)
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
      is_admin: !!new_is_admin,
      company_id,
    })
    .select()
    .single<User>();

  if (error || !user) {
    return res.status(500).json({ error: error?.message });
  }

  return res.status(201).json(user);
};

// actualizar usuario
export const updateUser = async (req: Request, res: Response) => {
  const { company_id, is_admin, user_id } = (req as any).user;
  const id_to_update = Number(req.params.id);

  // permisos: admin puede actualizar cualquiera, user solo a sí mismo
  if (!is_admin && id_to_update !== user_id) {
    return res.status(403).json({ error: "No autorizado" });
  }

  const { name, password, is_admin: new_is_admin } = req.body || {};

  if (!name && !password && new_is_admin === undefined) {
    return res
      .status(400)
      .json({
        error: "Al menos un campo (name, password, is_admin) es requerido",
      });
  }

  // si se intenta cambiar is_admin, solo admin puede hacerlo
  if (new_is_admin !== undefined && !is_admin) {
    return res
      .status(403)
      .json({ error: "Solo administradores pueden cambiar is_admin" });
  }


  if (name) {
    const { data: existingName } = await supabase
      .from("users")
      .select("id")
      .eq("name", name)
      .neq("id", id_to_update)
      .maybeSingle<Pick<User, "id">>();

    if (existingName) {
      return res
        .status(409)
        .json({ error: "Ya existe un usuario con ese nombre" });
    }
  }

  const updates: any = {};
  if (name) updates.name = name;
  if (new_is_admin !== undefined) updates.is_admin = !!new_is_admin;
  if (password) {
    // validar contraseña: al menos una mayúscula, un número y más de 5 caracteres
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error:
          "La contraseña debe contener al menos una letra mayúscula, un número y más de 5 caracteres",
      });
    }
    updates.password = await bcrypt.hash(password, SALT_ROUNDS);
  }

  // verificar existencia del usuario en la compañía
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("id", id_to_update)
    .eq("company_id", company_id)
    .maybeSingle<Pick<User, "id">>();

  if (!existingUser) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }

  const { data: user, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", id_to_update)
    .eq("company_id", company_id)
    .select("id, name, is_admin, company_id")
    .single<User>();

  if (error || !user) {
    return res
      .status(500)
      .json({ error: error?.message || "Error al actualizar" });
  }

  return res.json(user);
};

export const deleteUser = async (req: Request, res: Response) => {
  const { company_id, is_admin, user_id } = (req as any).user;
  const id_to_delete = Number(req.params.id);

  if (!is_admin) {
    return res.status(403).json({ error: "Solo administradores." });
  }

  if (id_to_delete === user_id) {
    return res
      .status(400)
      .json({ error: "No podés eliminar tu propio usuario." });
  }

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("id", id_to_delete)
    .eq("company_id", company_id)
    .single<Pick<User, "id">>();

  if (!user) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }

  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", id_to_delete)
    .eq("company_id", company_id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json({ deleted: true });
};
