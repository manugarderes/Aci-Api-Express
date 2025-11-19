import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/index.js";

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);


export const getAllUsers = async (req: Request, res: Response) => {
  const { companyId, isAdmin } = (req as any).user;

  if (!isAdmin) {
    return res.status(403).json({ error: "Solo administradores." });
  }

  const users = await User.findAll({
    where: { companyId },
    attributes: ["id", "name", "isAdmin", "companyId"],
  });

  return res.json(users);
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

  const existing = await User.findOne({
    where: { name, companyId },
  });
  if (existing) {
    return res.status(409).json({ error: "Ya existe un usuario con ese nombre" });
  }

  const hash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    name,
    password: hash,
    isAdmin: !!newIsAdmin,
    companyId,
  });

  return res.status(201).json({
    id: user.id,
    name: user.name,
    isAdmin: user.isAdmin,
    companyId,
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

  const user = await User.findOne({
    where: { id: idToDelete, companyId },
  });

  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

  await user.destroy();

  return res.json({ deleted: true });
};