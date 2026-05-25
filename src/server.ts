import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/prisma.js";
import { createServer } from "node:http";
import { setupSwagger } from "./config/swagger.js";


const server = createServer(app);
const PORT = process.env.PORT || 3000;

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
