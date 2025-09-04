import { Request, Response } from "express";
import { Company } from "../models/index.js";

export const getMine = async (req: Request, res: Response) => {
  const { companyId } = (req as any).user;
  const company = await Company.findByPk(companyId, {
    attributes: ["id", "name"],
  });
  if (!company) return res.status(404).json({ error: "No encontrado" });
  return res.json(company);
};
