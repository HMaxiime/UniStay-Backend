import jwt from "jsonwebtoken";
import { configDotenv } from "dotenv";
import type { NextFunction , Request , Response } from "express";

interface AuthRequest extends Request {
  userId: string;
  role: string;
}
configDotenv();

const JWT_SECRET = process.env.JWT_SECRET as string;

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
    if (!token) {   
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    req.userId = decoded.userId;
    req.role = decoded.role;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid token" });
  }
}

// ─── requireHost ──────────────────────────────────────────────────────────────
// Must run after authenticate.
// Returns 403 if the user's role is not HOST.

export function requireHost(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.role !== "HOST") {
    return res.status(403).json({ error: "Only hosts can perform this action" });
  }
  next();
}

// ─── requireStudent ─────────────────────────────────────────────────────────────
// Must run after authenticate.
// Returns 403 if the user's role is not Student.

export function requireStudent(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.role !== "STUDENT") {
    return res.status(403).json({ error: "Only Students can perform this action" });
  }
  next();
}

// ─── requireEmployer ─────────────────────────────────────────────────────────────
// Must run after authenticate.
// Returns 403 if the user's role is not Employer.

export function requireEmployer(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.role !== "EMPLOYER") {
    return res.status(403).json({ error: "Only Employers can perform this action" });
  }
  next();
}

// ─── requireAdmin ─────────────────────────────────────────────────────────────
// Must run after authenticate.
// Returns 403 if the user's role is not Admin.

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.role !== "ADMIN") {
    return res.status(403).json({ error: "Only Admins can perform this action" });
  }
  next();
}


export function authorize(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!roles.includes(req.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
}}

  