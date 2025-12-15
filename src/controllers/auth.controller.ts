import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { Secret, SignOptions } from "jsonwebtoken";

import { supabase } from "../config/supabase.js";
import type { User } from "../models/User.js";
import type { Company } from "../models/Company.js";

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);

const makeToken = (user: User) => {
  const secret: Secret = process.env.JWT_SECRET as Secret;
  if (!secret) throw new Error("JWT_SECRET no definido en .env");

  const sign_options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES || "7d") as any,
  };

  return jwt.sign(
    {
      user_id: user.id,
      company_id: user.company_id,
      is_admin: user.is_admin,
    },
    secret,
    sign_options
  );
};

export const getUser = async (req: Request, res: Response) => {
  const { user_id, company_id } = (req as any).user;

  const { data: user, error: user_error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user_id)
    .single<User>();

  if (user_error || !user) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }

  const { data: company, error: company_error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", company_id)
    .single<Company>();

  if (company_error || !company) {
    return res.status(404).json({ error: "Compañía no encontrada" });
  }

  return res.json({ user, company });
};

export const register = async (req: Request, res: Response) => {
  try {
    const { company_name, name, password, master_key } = req.body || {};

    if (!company_name || !name || !password || !master_key) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    if (master_key !== process.env.MASTER_KEY) {
      return res.status(401).json({ error: "Llave maestra inválida." });
    }

    const { data: existing_company } = await supabase
      .from("companies")
      .select("id")
      .eq("name", company_name)
      .maybeSingle<Pick<Company, "id">>();

    if (existing_company) {
      return res
        .status(409)
        .json({ error: "El nombre de la compañía ya existe" });
    }

    const { data: existing_user } = await supabase
      .from("users")
      .select("id")
      .eq("name", name)
      .maybeSingle<Pick<User, "id">>();

    if (existing_user) {
      return res
        .status(409)
        .json({ error: "El nombre de usuario ya existe" });
    }

    const { data: company, error: company_error } = await supabase
      .from("companies")
      .insert({
        name: company_name,
        logo: null,
        color_primary: null,
        color_secondary: null,
      })
      .select()
      .single<Company>();

    if (company_error || !company) throw company_error;

    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    const { data: user, error: user_error } = await supabase
      .from("users")
      .insert({
        name,
        password: hash,
        is_admin: true,
        company_id: company.id,
      })
      .select()
      .single<User>();

    if (user_error || !user) throw user_error;

    const token = makeToken(user);

    return res.status(201).json({
      user,
      company,
      token,
    });
  } catch (err) {
    console.error("Error en register:", err);
    return res.status(500).json({ error: "Error desconocido" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { name, password } = req.body || {};

    if (!name || !password) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    const { data: user, error: user_error } = await supabase
      .from("users")
      .select("*")
      .eq("name", name)
      .single<User>();

    if (user_error || !user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const { data: company, error: company_error } = await supabase
      .from("companies")
      .select("*")
      .eq("id", user.company_id)
      .single<Company>();

    if (company_error || !company) {
      return res.status(404).json({ error: "Compañía no encontrada" });
    }

    const token = makeToken(user);

    return res.json({
      user,
      company,
      token,
    });
  } catch (err) {
    console.error("Error en login:", err);
    return res.status(500).json({ error: "Error desconocido" });
  }
};
