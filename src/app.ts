import "dotenv/config";
import express from "express";
import authRoutes from "./routes/auth.routes.js";
import skillsRoutes from "./routes/skills.routes.js";
import courseRoutes from "./routes/course.routes.js";
import materialsRoute from "./routes/materials.routes.js"

const app = express();

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/skills", skillsRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/materials", materialsRoute);

app.get("/", (_req, res) => {
  res.json({ message: "UniStay+ API is running" });
});

export default app;
