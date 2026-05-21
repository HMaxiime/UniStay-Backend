import "dotenv/config";
import express from "express";

import authRoutes from "./routes/auth.routes.js";
import skillsRoutes from "./routes/skills.routes.js";
import courseRoutes from "./routes/courec.routes.js";
import jobsRoutes from "./routes/jobs.routes.js";
import jobsModuleRoutes from "./modules/jobs/routes.js";

// optional module-style routes
import housingsModuleRoutes from "./modules/housing/routes.js";
import bookingModuleRoutes from "./modules/bookings/routes.js";

const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/skills", skillsRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/jobs", jobsRoutes);

// Mount module-based routes (if present)
app.use("/api/housings", housingsModuleRoutes);
app.use("/api/bookings", bookingModuleRoutes);
app.use("/api/modules/jobs", jobsModuleRoutes);

app.get("/", (_req, res) => {
  res.json({ message: "UniStay+ API is running" });
});

export default app;
