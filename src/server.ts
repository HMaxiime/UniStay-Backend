import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/prisma.js";
import { createServer } from "node:http";
import { setupSwagger } from "./config/swagger.js";
import cors, { type CorsOptions } from "cors";
import morgan from "morgan";


const server = createServer(app);
const PORT = process.env.PORT || 3000;


const configuredOrigins = (process.env["CORS_ORIGINS"] || process.env["FRONTEND_URL"] || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = Array.from(
  new Set([
    ...configuredOrigins,
    `http://localhost:${PORT}`,
    `http://127.0.0.1:${PORT}`,
  ]),
);

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(process.env["NODE_ENV"] === "production" ? morgan("combined") : morgan("dev"));

setupSwagger(app);

async function startServer() {
  try {
    await connectDB();
   server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to the database:", error);
    process.exit(1);
  }
}

startServer();
