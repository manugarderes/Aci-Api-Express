import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { Company } from "../models/index.js";

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);

const makeToken = (company: Company) => {
  const secret: Secret = process.env.JWT_SECRET as Secret;
  if (!secret) throw new Error("JWT_SECRET no definido en .env");

  const signOptions: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES || "7d") as any,
  };

  return jwt.sign(
    { companyId: company.id, name: company.name },
    secret,
    signOptions
  );
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, password, masterKey } = req.body || {};
    if (!name || !password || !masterKey) {
      return res.status(400).json({ error: "name, password y Master Key son requeridos" });
    }

    if(masterKey != process.env.MASTER_KEY){
      return res.status(401).json({ error: "Master Key inválida." });
    }

    const existing = await Company.findOne({ where: { name } });
    if (existing) {
      return res.status(409).json({ error: "El nombre de compañía ya existe" });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const company = await Company.create({ name, password: hash });

    const token = makeToken(company);

    return res.status(201).json({
      id: company.id,
      name: company.name,
      token,
    });
  } catch (err: any) {
    console.error("Error en register:", err);
    return res.status(500).json({ error: "Error interno en register" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { name, password } = req.body || {};
    if (!name || !password) {
      return res.status(400).json({ error: "name y password son requeridos" });
    }

    const company = await Company.findOne({
      where: { name },
      attributes: ["id", "name", "password"], 
    });
    if (!company) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const ok = await bcrypt.compare(password, company.password);
    if (!ok) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = makeToken(company);

    return res.json({
      id: company.id,
      name: company.name,
      token,
    });
  } catch (err: any) {
    console.error("Error en login:", err);
    return res.status(500).json({ error: "Error interno en login" });
  }
};
