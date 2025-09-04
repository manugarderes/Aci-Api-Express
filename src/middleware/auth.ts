import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface JwtPayload {
  companyId: number;
  name: string;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const hdr = req.headers["authorization"];
    if (!hdr || !hdr.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Falta token Bearer" });
    }
    const token = hdr.substring("Bearer ".length);
    const secret = process.env.JWT_SECRET as string;
    const decoded = jwt.verify(token, secret) as JwtPayload;
    (req as any).user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Token inválido" });
  }
};
