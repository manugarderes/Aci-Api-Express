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

  const signOptions: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES || "7d") as any,
  };

  return jwt.sign(
    {
      userId: user.id,
      companyId: user.company_id,
      isAdmin: user.is_admin,
    },
    secret,
    signOptions
  );
};

export const getUser = async (req: Request, res: Response) => {
  const { userId, companyId } = (req as any).user;

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single<User>();

  if (userError || !user) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .single<Company>();

  if (companyError || !company) {
    return res.status(404).json({ error: "Compañía no encontrada" });
  }

  return res.json({ user, company });
};

export const register = async (req: Request, res: Response) => {
  try {
    const { companyName, name, password, masterKey } = req.body || {};

    if (!companyName || !name || !password || !masterKey) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    if (masterKey !== process.env.MASTER_KEY) {
      return res.status(401).json({ error: "Llave maestra inválida." });
    }

    /* --- company exists --- */
    const { data: existingCompany } = await supabase
      .from("companies")
      .select("id")
      .eq("name", companyName)
      .maybeSingle<Pick<Company, "id">>();

    if (existingCompany) {
      return res
        .status(409)
        .json({ error: "El nombre de la compañía ya existe" });
    }

    /* --- user exists --- */
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("name", name)
      .maybeSingle<Pick<User, "id">>();

    if (existingUser) {
      return res
        .status(409)
        .json({ error: "El nombre de usuario ya existe" });
    }

    /* --- create company --- */
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .insert({
        name: companyName,
        logo: null,
        color_primary: null,
        color_secondary: null,
      })
      .select()
      .single<Company>();

    if (companyError || !company) throw companyError;

    /* --- create user --- */
    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        name,
        password: hash,
        is_admin: true,
        company_id: company.id,
      })
      .select()
      .single<User>();

    if (userError || !user) throw userError;

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

/* =========================
   LOGIN
========================= */
export const login = async (req: Request, res: Response) => {
  try {
    const { name, password } = req.body || {};

    if (!name || !password) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("name", name)
      .single<User>();

    if (error || !user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const { data: company } = await supabase
      .from("companies")
      .select("*")
      .eq("id", user.company_id)
      .single<Company>();

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
