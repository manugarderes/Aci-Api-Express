import { Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import type { Company } from "../models/Company.js";

export const getMine = async (req: Request, res: Response) => {
  const { companyId } = (req as any).user;

  const { data: company, error } = await supabase
    .from("companies")
    .select("id, name")
    .eq("id", companyId)
    .single<Pick<Company, "id" | "name">>();

  if (error || !company) {
    return res.status(404).json({ error: "No encontrado" });
  }

  return res.json(company);
};
