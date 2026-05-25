import jwt from "jsonwebtoken";
import { configDotenv } from "dotenv";
import type { NextFunction, Request, Response } from "express";

configDotenv();

export type AuthRequest = Request & {
  userId?: string;
  user?: {
    id: string;
    role: string;
  };
};

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET as string;

// ─── authenticate ─────────────────────────────────────────────────────────────

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    req.user = { id: decoded.id, role: decoded.role };
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid token" });
  }
}

// ─── requireHost ──────────────────────────────────────────────────────────────
export function requireHost(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "HOST") {
    return res.status(403).json({ error: "Only hosts can perform this action" });
  }
  next();
}

// ─── requireStudent ───────────────────────────────────────────────────────────
export function requireStudent(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "STUDENT") {
    return res.status(403).json({ error: "Only students can perform this action" });
  }
  next();
}

// ─── requireEmployer ──────────────────────────────────────────────────────────
export function requireEmployer(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "EMPLOYER") {
    return res.status(403).json({ error: "Only employers can perform this action" });
  }
  next();
}

// ─── requireAdmin ─────────────────────────────────────────────────────────────
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ error: "Only admins can perform this action" });
  }
  next();
}

// ─── authorize (multi-role) ───────────────────────────────────────────────────
export function authorize(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}
