import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import housingsRoutes from "./modules/housing/routes.js";
import bookingRoutes from "./modules/bookings/routes.js";
const app = express();
dotenv.config();
app.use(express.json());
app.use("/api/auth", authRoutes);
app.get("/", (_req, res) => {
    res.json({ message: "UniStay+ API is running" });
});
app.use("/api/listins", housingsRoutes);
app.use("/api/bookings", bookingRoutes);
app.get('/', (req, res) => {
    res.json({ message: 'UniStay+ API is running' });
});
export default app;
//# sourceMappingURL=app.js.map