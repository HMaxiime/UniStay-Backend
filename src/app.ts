import "dotenv/config";
import express from "express";
import authRoutes from "./routes/auth.routes.js";

const app = express();

app.use(express.json());
app.use("/api/auth", authRoutes);

app.get("/", (_req, res) => {
  res.json({ message: "UniStay+ API is running" });
});

export default app;
