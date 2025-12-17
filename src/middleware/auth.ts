import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { supabase } from "../config/supabase.js";

export interface JwtPayload {
  user_id: number;
  company_id: number;
  is_admin: boolean;
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const hdr = req.headers["authorization"];
    if (!hdr || !hdr.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Falta token Bearer" });
    }

    const token = hdr.substring("Bearer ".length);
    const secret = process.env.JWT_SECRET as string;
    if (!secret)
      return res.status(500).json({ error: "JWT_SECRET no definido" });

    const decoded = jwt.verify(token, secret) as JwtPayload;

    // Verificar que el usuario exista en la DB (no hace falta agregar campos extra)
    const { data: user, error } = await supabase
      .from("users")
      .select("id, company_id, is_admin")
      .eq("id", decoded.user_id)
      .maybeSingle<any>();

    if (error || !user) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    (req as any).user = {
      user_id: user.id,
      company_id: user.company_id ?? decoded.company_id,
      is_admin: user.is_admin ?? decoded.is_admin,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido" });
  }
};

// export const authMiddleware = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const hdr = req.headers["authorization"];
//     if (!hdr || !hdr.startsWith("Bearer ")) {
//       return res.status(401).json({ error: "Falta token Bearer" });
//     }

//     const token = hdr.substring("Bearer ".length);
//     const secret = process.env.JWT_SECRET as string;

//     const decoded = jwt.verify(token, secret) as JwtPayload;
//     (req as any).user = decoded;

//     next();
//   } catch {
//     return res.status(401).json({ error: "Token inválido" });
//   }
// };
