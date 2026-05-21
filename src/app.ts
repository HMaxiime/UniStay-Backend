<<<<<<< HEAD
import express from 'express'
import dotenv from 'dotenv'
import authRoutes from './modules/auth/routes.js'
import housingsRoutes from "./modules/housing/routes.js"
import bookingRoutes from "./modules/bookings/routes.js"
dotenv.config()
=======
import "dotenv/config";
import express from "express";
import authRoutes from "./routes/auth.routes.js";
import skillsRoutes from "./routes/skills.routes.js";
import courseRoutes from "./routes/courec.routes.js";

const app = express();
>>>>>>> origin/main

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/skills", skillsRoutes);
app.use("/api/courses", courseRoutes);

app.get("/", (_req, res) => {
  res.json({ message: "UniStay+ API is running" });
});

<<<<<<< HEAD

app.use("/api/listins", housingsRoutes )
app.use("/api/bookings", bookingRoutes)
app.get('/', (req, res) => {
  res.json({ message: 'UniStay+ API is running' })
})

export default app
=======
export default app;
>>>>>>> origin/main
