import jwt from "jsonwebtoken";
import { configDotenv } from "dotenv";
import type { NextFunction, Request, Response } from "express";
export interface AuthRequest extends Request {
  userId: string;
  role: string;
  user?: {
    id: string;
    role: string;
  };
}
configDotenv();

const JWT_SECRET = process.env.JWT_SECRET as string;

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authReq = req as AuthRequest;
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      role: string;
    };
    authReq.userId = decoded.id;
    authReq.role = decoded.role;
    authReq.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid token" });
  }
}

// ─── requireHost ──────────────────────────────────────────────────────────────
// Must run after authenticate.
// Returns 403 if the user's role is not HOST.

export function requireHost(req: Request, res: Response, next: NextFunction) {
  const authReq = req as AuthRequest;
  if (authReq.role !== "HOST") {
    return res
      .status(403)
      .json({ error: "Only hosts can perform this action" });
  }
  next();
}

// ─── requireStudent ─────────────────────────────────────────────────────────────
// Must run after authenticate.
// Returns 403 if the user's role is not Student.

export function requireStudent(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authReq = req as AuthRequest;
  if (authReq.role !== "STUDENT") {
    return res
      .status(403)
      .json({ error: "Only Students can perform this action" });
  }
  next();
}

// ─── requireEmployer ─────────────────────────────────────────────────────────────
// Must run after authenticate.
// Returns 403 if the user's role is not Employer.

export function requireEmployer(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authReq = req as AuthRequest;
  if (authReq.role !== "EMPLOYER") {
    return res
      .status(403)
      .json({ error: "Only Employers can perform this action" });
  }
  next();
}

// ─── requireAdmin ─────────────────────────────────────────────────────────────
// Must run after authenticate.
// Returns 403 if the user's role is not Admin.

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authReq = req as AuthRequest;
  if (authReq.role !== "ADMIN") {
    return res
      .status(403)
      .json({ error: "Only Admins can perform this action" });
  }
  next();
}

export function authorize(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    if (!roles.includes(authReq.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}
