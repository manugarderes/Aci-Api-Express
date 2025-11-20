import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { Secret, SignOptions } from "jsonwebtoken";

import { User, Company } from "../models/index.js";

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
      companyId: user.companyId,
      isAdmin: user.isAdmin,
    },
    secret,
    signOptions
  );
};

export const getUser = async (req: Request, res: Response) => {
  const { userId, companyId } = (req as any).user;
  const user = await User.findOne({ where: { id: userId } });
  const company = await Company.findOne({ where: { id: companyId } });
  return res.json({user, company});
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

    const existingCompany = await Company.findOne({
      where: { name: companyName },
    });
    if (existingCompany) {
      return res
        .status(409)
        .json({ error: "El nombre de la compañía ya existe" });
    }

    const existingUser = await User.findOne({
      where: { name: name },
    });
    if (existingUser) {
      return res
        .status(409)
        .json({ error: "El nombre de usuario ya existe" });
    }

    const company = await Company.create({
      name: companyName,
      logo: null,
      colorPrimary: null,
      colorSecondary: null,
    });

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      name: name,
      password: hash,
      isAdmin: true,
      companyId: company.id,
    });

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

    const user = await User.findOne({
      where: { name: name },
    });

    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const company = await Company.findOne({
      where: {id: user.companyId}
    })

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: "Credenciales inválidas" });
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